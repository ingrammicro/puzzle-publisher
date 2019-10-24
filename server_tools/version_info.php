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

class Worker{
    public $ref = "";           // https://myserver.com/project/82/index.html#support_1
    public $local_url = "";     // https://myserver.com/project/82/index.html#support_1
    public $project_url = "";   // https://myserver.com/project
    public $base_url = "";      // https://myserver.com/
    public $local_dir= "";      // project/82
    public $ver = "";           // 82
    public $current_ver = "";   // 82 or live
    public $ver_info = [];

    public $is_live = FALSE;

    public function __construct() 
    {
        $this->base_url = (getenv("HTTPS")=="on"?"https://":"http://").getenv("SERVER_NAME")."/";
        $this->ver = $_GET["ver"]."";
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
            if($ref=='' || strpos($ref,($this->base_url))!=0){
                print("Error: Wrong context");
                return FALSE;
            }
            // extract local URL to mockups from referrer
            $this->local_url = $ref;           
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
            $this->current_ver = $integer_info[2];
        }else{
            $this->is_live = TRUE;
            $this->current_ver = "live";
        }

        // drop version from local URL
        $this->project_url = substr($localurl,0,$vers_pos);
        $this->local_dir = substr($this->project_url,strlen($this->base_url));
        //print( $this->local_url);
        //print( $this->base_url);
        
        return TRUE;
    }

    private function _tranformImageURLbyPreview($img){
        $ver = "/".$this->ver."/images/";
        return str_replace($ver,($ver."previews/"),$img);
    }

    private function _find_info(){
        // read chnange journal into normalised $data
        $file_data = file_get_contents("journals/".$this->local_dir."/journal.txt");        
        if(FALSE===$file_data) $file_data="";
        $text_data = "[".$file_data."[]]";        
        $data = json_decode($text_data,TRUE);
        
        // find single record in data
        $dir = $this->local_dir."/".$this->ver;

        $ver_index = array_search($dir, array_column($data, 'dir'));
        if(FALSE===$ver_index){
            print("Error: can't find project '".$this->local_dir."' and version :".$this->ver);
            return FALSE;
        }
        $ver_info = $data[$ver_index];

        // replace image URL by preview image URL;
        $changed = 0;
        $new = 0;
        foreach($ver_info['screens_changed'] as $index => $screen){
            $ver_info['screens_changed'][$index]['image_url'] = $this->_tranformImageURLbyPreview ($screen['image_url']);
            $screen_url = $ver_info['screens_changed'][$index]['screen_url'];

            // exctract page name after #
            $screen_name_pos = strpos($screen_url,'#');
            $screen_name = FALSE===$screen_name_pos?"":substr($screen_url,$screen_name_pos+1);
            $ver_info['screens_changed'][$index]['screen_name']  =  $screen_name;

            if($screen['is_new']) $new++; else $changed++;
        }
        $ver_info['screens_total_new']=$new;
        $ver_info['screens_total_changed']=$changed;

        
        $this->ver_info = $ver_info;
        return TRUE;
    }

    private function _build_url($version){
        return $this->base_url.$this->project_url."/".$version."/";        
    }
  
    public function collectInfo($local_url="")
    {
        if(!$this->_parse_context($local_url)) return FALSE;
        if(!$this->_find_info()) return FALSE;       

        return TRUE;
    }

    public function dump_json(){
        print(json_encode($this->ver_info,JSON_UNESCAPED_SLASHES));
    }

}

$parser = new Worker();
if($parser->collectInfo()){
    $parser->dump_json();
}else{
    print("[]"); 
}
?>