<?php

class Worker{
    public $ref = "";
    public $baseurl = "";
    public $data = [];

    public function __construct() 
    {
        $this->baseurl = (getenv("HTTPS")=="on"?"https://":"http://").getenv("SERVER_NAME")."/";
        $this->ref = getenv("HTTP_REFERER");        
    }

   
    public function _print_data() 
    {
        $file_data = file_get_contents("data.raw");
        if(FALSE===$file_data) $file_data="";
        $text_data = "[".$file_data."[]]";

        print($text_data); 
        return TRUE;
    }


    public function run()
    {

        if(!$this->_print_data()) return FALSE;
        return TRUE;
    }

  
}


$worker = new Worker();
$worker->run();