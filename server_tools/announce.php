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

class Worker{
    public $ref = "";
    public $baseurl = "";
    public $data = [];

    public function __construct() 
    {
        $this->baseurl = (getenv("HTTPS")=="on"?"https://":"http://").getenv("SERVER_NAME")."/";
        $this->ref = getenv("HTTP_REFERER");

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
        $data = array(
            'time' => time(),
            'dir' => $_GET["dir"]."",
            'author' => $_GET["author"]."",
            'message' => $_GET["msg"]."",
            'ver' => $_GET["ver"].""
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
        $data['url'] = $this->baseurl.$data['dir'];

        return $data;
    }

    private function _saveData(){
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



    private function _postToTelegram()
    {
        $apiToken =  $this->config['telegram-bot-token'];
        $channelID =  $this->config['telegram-channel-id'];

        if(''==$apiToken) return TRUE;
        
        $data = [
            'chat_id' =>  $channelID,
            'text' => $this->data['author'].' just published '. $this->data['url']. " \n". $this->data['message']
        ];

        $response = file_get_contents("https://api.telegram.org/bot$apiToken/sendMessage?" . http_build_query($data) );

        return TRUE;
    }

    public function run()
    {
        $this->data = $this->_readParams();
        if(FALSE===$this->data) return FALSE;

        if(!$this->_saveData()) return FALSE;
        $this->_postToTelegram();


        return TRUE;
    }

  
}


$worker = new Worker();
$worker->run();