<?php
header('Access-Control-Allow-Origin: *');
include 'lib/Forum.php';
include 'lib/Frontend.php';

const temp_folder = "temp";

function exitError($errorCode)
{
    $res =[
        'status'=> 'error',
        'errorCode'=>$errorCode
    ];    
	echo json_encode($res);
	exit;
}

function exitSuccess($message,$data=null)
{
    $res =[
        'status'=> 'ok',
        'message'=>$message,
        'data'=>$data
    ];    
	echo json_encode($res);
	exit;
}

function http_get_param($name)
{
	if(!array_key_exists($name,$_GET)) return '';
	return $_GET[$name];
}

function http_post_param($name)
{
	if(!array_key_exists($name,$_POST)) return '';
	return $_POST[$name];
}

/// INIT FORUM
$forum = Forum::build($_GET['fid']);
if(is_string($forum)){
    exitError($forum);
}

/// PROCESS INCOMING COMMANDS
$cmd = $_GET['cmd'];
if('listComments'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page);

    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    exitSuccess("",$commentsInfo);    
}else if('addComment'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page);

    if(False===$page->addComment()) exitError($page->lastError);
    exitSuccess("Added new comment");    
}if('buildCommentsHTML'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page);

    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    $html = Frontend::buildCommentsHTML( $page,$commentsInfo);    
    echo $html;
    exit;    
}
else{
    exitError(ERROR_UNKNOWN_CMD);
}

?>
