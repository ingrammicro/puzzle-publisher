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
    public $result = [];

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
        // read change journal into normalised $data
        $file_data = file_get_contents("journals/".$this->local_dir."/journal.txt");        
        if(FALSE===$file_data) $file_data="";
        $text_data = "[".$file_data."[]]";        
        $data = json_decode($text_data,TRUE);
        
        // resort changes from new to old
        $data = array_filter($data,function($a){return array_key_exists('ver',$a); });
        usort($data,function ($a, $b) { return intval($b['ver']) - intval($a['ver']) ;});

        // precalculate some data
        foreach($data as &$rec){
            $this->_extend_rec_info($rec);
        }
        
        $this->result['recs'] = $data;
        return TRUE;
    }

    private function _extend_rec_info(& $rec){
    
        // replace image URL by preview image URL;
        $changed = 0;
        $new = 0;
        foreach($rec['screens_changed'] as $index => $screen){
            $rec['screens_changed'][$index]['image_url'] = $this->_tranformImageURLbyPreview ($screen['image_url']);
            $screen_url = $rec['screens_changed'][$index]['screen_url'];

            // exctract page name after #
            $screen_name_pos = strpos($screen_url,'#');
            $screen_name = FALSE===$screen_name_pos?"":substr($screen_url,$screen_name_pos+1);
            $rec['screens_changed'][$index]['screen_name']  =  $screen_name;

            if($screen['is_new']) $new++; else $changed++;
        }
        $rec['screens_total_new']=$new;
        $rec['screens_total_changed']=$changed;
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
        print(json_encode($this->result,JSON_UNESCAPED_SLASHES));
    }

}

$parser = new Worker();
if($parser->collectInfo()){
    $parser->dump_json();
}else{
    print("[]"); 
}
?>
