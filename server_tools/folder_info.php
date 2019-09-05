<?php

include_once "lib/FolderInfo.php";

$parser = new FolderInfo();
if($parser->collectInfo()){
    $parser->dump_json();
}else{
    print("[]");
}
?>