<?php

/*
    To announce published mockups in Telegram channel you need:
    1. Create a Telegram public channel
    2. Create a Telegram BOT via BotFather
    3. Set the bot as administrator in your channel    
    See details here: https://medium.com/@xabaras/sending-a-message-to-a-telegram-channel-the-easy-way-eb0a0b32968
    4. Specify parameters in config.js file
    5. Be sure that your web server can write/read data.raw and config.json files. 
    I used the following commangs:
    chcon -R -t httpd_sys_content_t .
    chcon -R -t httpd_sys_rw_content_t  .
    chown -R apache:apache config.json
    chown -R apache:apache data.raw 
*/

include_once "lib/FolderInfo.php";



class Worker{
    public $ref = "";
    public $base_url = "";
    public $data = [];

    public function __construct() 
    {
        $this->ref = getenv("HTTP_REFERER");

        // base_url = https://myserver.com
        $this->base_url = (getenv("HTTPS")=="on"?"https://":"http://").getenv("SERVER_NAME");

        // local_url = /_tools/
        $local_url = $_SERVER['REQUEST_URI'];
        $this->local_url = substr($local_url,0,strrpos($local_url,"/announce.php")+1);

        // local_path = /var/www/html/_tools
        $local_path = $_SERVER['SCRIPT_FILENAME'];
        $this->local_path = substr($local_path,0,strrpos($local_path,"/"));

        // READ CONFIG
        $config_text = file_get_contents("config.json");
        if(FALSE===$config_text){
            $this->config = [];     
            print("Error: can not open config.json");                    
        }else{
            $this->config = json_decode($config_text,TRUE);
        }
    }

    private function _readParams(){
        // read params
        $this->skip_tele = $_GET["NOTELE"]."";
        $this->skip_save = $_GET["NOSAVE"]."";

        $data = array(
            'time' => time(),
            'dir' => $_GET["dir"]."",       //  myproject/77
            'author' => $_GET["author"]."",
            'message' => $_GET["msg"]."",
            'ver' => $_GET["ver"]."",       // 77
            'down_ver' => '',               // will be specified later
            'screens_changed' => []        //[  support_1@2x.png  ]
        );
        
        // check params
        if(''==$data['dir']){
            print("Error: 'dir' is empty ");
            return FALSE;
        }
        if(''==$data['author']){
            print("Error: 'author' is empty");
            return FALSE;
        }
        if(''==$data['message']){
            print("Error: 'msg' is empty");
            return FALSE;
        }

        // post-process
        $data['url'] = $this->base_url."/".$data['dir'];

        return $data;
    }

    private function _findPrevVersion(){        
        // get more info about published version

        $folder_info = new FolderInfo();
        if(!$folder_info->collectInfo($this->data['dir'])){
            print("Error: can not get version folder information");
            return FALSE; 
        }

        $this->data['down_ver'] = $folder_info->down_ver;
        $this->local_dir = $folder_info->local_dir;
        
        return TRUE;
    }

    private function _compareVers(){
        if( ''==$this->data['down_ver'] ) return TRUE;
        $cmd = "diff -rq";
        $cmd = $cmd." ".$this->local_path."/".$this->local_dir."/".$this->data['down_ver'];
        $cmd = $cmd." ".$this->local_path."/".$this->local_dir."/".$this->data['ver'];
        $cmd = $cmd." | grep /images/ | grep -v /preview";

        $res = shell_exec($cmd);
        if(NULL==$res) return TRUE;

        $this->data['screens_changed'] = [];
        $this->data['journals_path'] = str_replace("//","/",$this->local_url)."journals";

        $cmd_diff = "";
        
        $lines = explode("\n",$res);
        foreach($lines as $line){           
            $info = $lines = explode(" ",$line);   
            $image_base_url = $this->base_url."/".$this->data['dir']."/images/";
            $screen_base_url = $this->base_url."/".$this->data['dir']."/index.html#";
            
            $is_new = FALSE;
            $file_info = NULL;
            $path_diff = '';

            if('Files'==$info[0]){
                // Checking this format:             
                // Files /var/www/html/test/101/support_1@2x.png and /var/www/html/test/102/support_1@2x.png differ
                $file_info =  pathinfo($info[3]);

                // compare images               
                {
                    $path_new = $info[3];
                    $path_prev = str_replace("/".$this->data['ver']."/","/".$this->data['down_ver']."/",$info[3]);
                    $dir_diff = 'journals/'.$this->data['dir']."/diffs";                    

                    if(!file_exists($dir_diff) && !mkdir($dir_diff,0777,TRUE)){
                        print("Error: can not create folder ".$dir_diff);
                        return FALSE;
                    }                                    
                    $path_diff = $dir_diff."/".$file_info['basename'];

                    $cmd_diff .=  ($cmd_diff!=''?'; ':'')."compare $path_prev $path_new $path_diff 2>/dev/null >/dev/null";
                    //$cmd_diff =  ($cmd_diff!=''?'; ':'')."compare $path_prev $path_new $path_diff 2>/dev/null >/dev/null";
                }
            }else if('Only'==$info[0]){
                // Checking this format:             
                // Only in /var/www/html/test/101/images: support_1@2x.png
                $file_info =  pathinfo($info[3]);
                $is_new = TRUE;
            }


            if(NULL==$file_info) continue;

            $image_name = $file_info['basename'];
            $screen_name = $file_info['filename'];

            // skip Retina duplicate
            if(strpos($image_name,'@2x.png')) continue;

            $this->data['screens_changed'][] = [
                'is_new'      => $is_new,
                'is_diff'     => !$is_new,
                'screen_url' =>  $screen_base_url.$screen_name,
                'image_url' =>  $image_base_url.$image_name
            ];
        }

        // Generate images with differences
        if($cmd_diff!=''){
            $cmd_diff .= " &";
            shell_exec($cmd_diff);
        }
    }

    private function _saveData(){
        if($this->skip_save!='') return TRUE;

        // Save data to project subfolder folder
        $dir_path =  str_replace("../","journals/",$this->local_dir);
        if(!file_exists($dir_path) && !mkdir($dir_path,0777,TRUE)){
            print("Error: can not create folder ".$dir_path);
            return FALSE;
        }

        $path = $dir_path."/journal.txt";
        $text = json_encode($this->data,JSON_UNESCAPED_SLASHES).",\n";
        
        if(FALSE==file_put_contents($path,$text,FILE_APPEND)){
            print("Error: can not open file ".$path);
            return FALSE;
        }       
        
        $summary_rec = [
            'time' => $this->data['time'],
            'dir' => $dir_path,
        ];
        file_put_contents("journals/journals.txt", json_encode($summary_rec,JSON_UNESCAPED_SLASHES).",\n",FILE_APPEND);

        return TRUE;
    }

    private function _saveSplitData($local_dir,$data){

        // Save data to project subfolder folder
        $dir_path =  str_replace("../","journals/",$local_dir);
        if(!file_exists($dir_path) && !mkdir($dir_path,0777,TRUE)){
            print("Error: can not create folder ".$dir_path);
            return FALSE;
        }

        $path = $dir_path."/journal.txt";
        $text = json_encode($data,JSON_UNESCAPED_SLASHES);
        $text = preg_replace("/^\[{1}/","",$text);
        $text = preg_replace("/\]{1}$/",",\n",$text);
        
        if(FALSE==file_put_contents($path,$text,$options)){
            print("Error: can not open file ".$path);
            return FALSE;
        }       
        

        return TRUE;
    }


    private function _postToTelegram(){
        if($this->skip_tele!='') return TRUE;

        $apiToken =  $this->config['telegram-bot-token'];
        $channelID =  $this->config['telegram-channel-id'];

        if(''==$apiToken) return TRUE;
        
        $data = [
            'chat_id' =>  $channelID,
            'text' => $this->data['author'].' published '. $this->data['url']. "?v \n- ". $this->data['message']
        ];

        $response = file_get_contents("https://api.telegram.org/bot$apiToken/sendMessage?" . http_build_query($data) );

        return TRUE;
    }


    private function  _splitData(){
        $file_data = file_get_contents("data.raw");
        if(FALSE===$file_data) $file_data="";
        $text_data = "[".$file_data."[]]";        
        $data = json_decode($text_data,TRUE);

        // group all records per project
        $new_projects = [];
        $new_data = [];
        foreach($data as $old_rec){
            if(""==$old_rec['dir']) continue;
            // cut /234
            $ver_pos = strrpos($old_rec['dir'], "/" );
            if(FALSE===$ver_pos)
                $dir = $old_rec['dir'];
            else 
                $dir = substr( $old_rec['dir'] ,0, $ver_pos);

            print("found '".$old_rec['dir']."'<br/>"); 

            if( !array_key_exists($dir,$new_projects) ){
                $new_projects[$dir] = [];
            }
            $new_projects[$dir][] = $old_rec;
            
            // 
            $new_data[] = [
                'time' => $old_rec['time'],
                'dir' => $dir 
            ];

            // 
        }
        
        // save every project
        foreach(array_keys($new_projects) as $dir){
            $this->_saveSplitData("../".$dir,$new_projects[$dir]);
            print("saved ".$dir."<br/>");
        }

        // 
        $new_data_text = json_encode($new_data,JSON_UNESCAPED_SLASHES);
        $new_data_text = preg_replace("/^\[{1}/","",$new_data_text);
        $new_data_text = preg_replace("/\]{1}$/",",\n",$new_data_text);

        file_put_contents("journals/journals.txt", $new_data_text);
    }

    public function run()
    {
        //$this->_splitData();
        //return TRUE;
        
        // COLLECT DATA
        $this->data = $this->_readParams();
        if(FALSE===$this->data) return FALSE;

        $this->_findPrevVersion();
        $this->_compareVers();
        
        // SAVE DATA TO DISK
        if(!$this->_saveData()) return FALSE;
        
        // INFORM SUBSCRIBERS
        $this->_postToTelegram();

        return TRUE;
    }
    

  
}


$worker = new Worker();
$worker->run();
