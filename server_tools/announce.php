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
        
        $lines = explode("\n",$res);
        foreach($lines as $line){           
            $info = $lines = explode(" ",$line);   
            $image_base_url = $this->base_url."/".$this->data['dir']."/images/";
            $screen_base_url = $this->base_url."/".$this->data['dir']."/index.html#";
            
            $is_new = FALSE;
            $file_info = NULL;
            if('Files'==$info[0]){
                // Checking this format:             
                // Files /var/www/html/test/101/support_1@2x.png and /var/www/html/test/102/support_1@2x.png differ
                $file_info =  pathinfo($info[3]);
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
                'screen_url' =>  $screen_base_url.$screen_name,
                'image_url' =>  $image_base_url.$image_name
            ];
        }
    }

    private function _saveData(){
        if($this->skip_save!='') return TRUE;

        $text = json_encode($this->data,JSON_UNESCAPED_SLASHES);

        $path = 'data.raw';
        $fp = fopen($path, 'a+');
        if (false===$fp){
            print("Error: can not open file");
            return FALSE;
        }
        fwrite($fp, $text);
        fwrite($fp, ",\n");
        fclose($fp);

        return TRUE;
    }


    private function _postToTelegram(){
        if($this->skip_tele!='') return TRUE;

        $apiToken =  $this->config['telegram-bot-token'];
        $channelID =  $this->config['telegram-channel-id'];

        if(''==$apiToken) return TRUE;
        
        $data = [
            'chat_id' =>  $channelID,
            'text' => $this->data['author'].' published '. $this->data['url']. " \n- ". $this->data['message']
        ];

        $response = file_get_contents("https://api.telegram.org/bot$apiToken/sendMessage?" . http_build_query($data) );

        return TRUE;
    }

    public function run()
    {
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