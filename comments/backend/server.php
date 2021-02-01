<?php
header('Access-Control-Allow-Origin: *');
include 'lib/Forum.php';
include 'lib/Frontend.php';

const temp_folder = "temp";

function exitError($errorCode)
{
    $res =[
        'status'=> 'error',
        'message'=>'Error '.$errorCode.' occured',
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
if('addComment'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page);
    if(False===$page->addComment()) exitError($page->lastError);
    // load updated comments
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build HTML
    $html = "";
    $html .= Frontend::buildCommentListHTML($page,$commentsInfo); 
    //
    exitSuccess("Added new comment",$html);
}else if('login'==$cmd){
    // Send authroization code
    $res = $forum->login();
    if(False===$res) exitError($forum->lastError);
    exitSuccess("Sent authorization code",$res);
}else if('buildFullHTML'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page); 
    // load data
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build html
    $html = "";
    $html .= Frontend::buildFullHTML( $forum,$page,$commentsInfo); 
    //
    exitSuccess("",$html);
}else if('buildCommentsHTML'==$cmd){
    $page = $forum->buildPage();
    if(is_string($page)) exitError($page);
    // load data
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build html
    $html = "";
    $html .= Frontend::buildCommentListHTML($page,$commentsInfo); 
    //
    exitSuccess("",$html);
}
else{
    exitError(ERROR_UNKNOWN_CMD);
}

?>
