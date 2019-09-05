<?php

function folderInfoFilter($var){
    return (int)$var>0;
}

// result [string(starting from "/"),pos,integer]
function find_int_in_string($text) {
    preg_match('/\/(\d+)/', $text, $m, PREG_OFFSET_CAPTURE);    
    if (sizeof($m))
        return [$m[0][0],$m[0][1],(int)$m[1][0]];

    return FALSE;
}

class FolderInfo{
    public $ref = "";

    public $project_url = "";
    public $localurl = "";
    public $local_dir = "";
    public $is_live = FALSE;
    public $version = -1;
    public $versions = [];

    public $link_live = '';
    public $link_ver = '';
    public $link_up = '';
    public $link_down = '';

    public function __construct() 
    {
        $this->baseurl = (getenv("HTTPS")=="on"?"https://":"http://").getenv("SERVER_NAME")."/";
    }

    // get requested parameters from HTTP_REFERER
    // or from LOCAL_URL get parameter
    private function _parse_context($local_url="")
    {           
        if($local_url!=""){
            // accept local URL in GET parameters
            $this->local_url = $local_url;
        }else{
            $ref = getenv("HTTP_REFERER");
            // check referrer is not empty and it contains base url
            if($ref=='' || strpos($ref,($this->baseurl))!=0){
                print("Error: Wrong context");
                return FALSE;
            }
            // extract local URL to mockups from referrer
            $this->local_url = substr($ref,strlen($this->baseurl));
        }

        $localurl = $this->local_url;

        // extract version information from local url
        $vers_pos = strpos($localurl,"/live/");
        if($vers_pos===FALSE)
        {
            // we not in live
            $integer_info = find_int_in_string($localurl);
           
            // check if we not in /<NUMBER>
            if($integer_info===FALSE) return FALSE;

            $vers_pos = $integer_info[1];
            $this->version = $integer_info[2];
        }else{
            $this->is_live = TRUE;
        }

        // drop version from local URL
        $this->project_url = substr($localurl,0,$vers_pos);
        $this->local_dir = '../'.$this->project_url;
        
        return TRUE;
    }

    private function _read_dir()
    {
        if(!is_dir( $this->local_dir )){
            print("Error: Can't read folder: ".$this->local_dir);
            return FALSE;
        }
        // get folder content
        $raw_files = scandir( $this->local_dir );
        // drop non-integers
        $raw_files = array_filter($raw_files,"folderInfoFilter");
        // sort 
        sort($raw_files, SORT_NUMERIC);
        // sort reverse 
        $raw_files = array_reverse($raw_files);
        // add "live" to begining
        array_unshift($raw_files,"live");

        $this->versions = $raw_files;
        return TRUE;
    }

    private function _build_url($version){
        return $this->baseurl.$this->project_url."/".$version."/";        
    }
    
    private function _calc_links(){
        $this->link_up = "";
        $this->up_ver = "";
        $this->down_ver = "";
        $this->link_downr = "";


        if($this->is_live){
            $this->link_live = "";
            $this->link_ver = $this->_build_url( $this->versions[1] );
            $this->down_ver = count($this->versions)>2 ? $this->versions[2] : "";
            $this->link_down = $this->down_ver!=''?$this->_build_url(  $this->down_ver ) : "";
        }else{
            $this->link_live  = $this->_build_url(  $this->versions[0] );
            $this->link_ver = "";            

            $ver_pos = array_search($this->version,$this->versions);

            if($ver_pos==1){
                // the actual version
            }else{                
                $this->up_ver = $this->versions[$ver_pos-1];
                $this->link_up = $this->_build_url( $this->up_ver );
            }

            if($ver_pos==(count( $this->versions)-1)){
                // the first version                
            }else{                
                $this->down_ver = $this->versions[$ver_pos+1];
                $this->link_down = $this->_build_url( $this->down_ver );
            }
        }
    }

    public function collectInfo($local_url="")
    {
        if(!$this->_parse_context($local_url)) return FALSE;
        if(!$this->_read_dir()) return FALSE;       
        $this->_calc_links();

        return TRUE;
    }

    public function dump_json(){
        print(json_encode($this,JSON_UNESCAPED_SLASHES));
    }

    public function debug(){
        foreach($this->versions as $file)
        {
            echo "$file<br/>";
        }
    }
}

?>