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
    // user send session id, but session was expired
    if(http_post_param("sid")!="" && Forum::$o && ""==Forum::$o->sid) 
        $res['dropSession'] = True;

	echo json_encode($res);
	exit;
}

function http_get_param($name)
{
	if(!array_key_exists($name,$_GET)) return '';
	return trim($_GET[$name]);
}

function http_post_param($name)
{
	if(!array_key_exists($name,$_POST)) return '';
	return trim($_POST[$name]);
}

/// INIT FORUM
$forum = Forum::build($_GET['fid']);
if($forum->lastError!="") exitError($forum->lastError);

/// PROCESS INCOMING COMMANDS
$cmd = $_GET['cmd'];

// RUN COMMANDS WITHOUT USER CONTEXT
if('login'==$cmd){
    // Send authroization code
    $res = $forum->login();
    if(False===$res) exitError($forum->lastError);
    exitSuccess("Sent authorization code",$res);
}else if('logout'==$cmd){
    // Send authroization code
    $res = $forum->logout();
    if(False===$res) exitError($forum->lastError);
    exitSuccess("User logout ok",$res);
}else if('auth'==$cmd){
    // Send authroization code
    $res = $forum->auth();
    if(False===$res) exitError($forum->lastError);
    exitSuccess("User authorized and logged",$res);    
}else if('getPageInfo'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    // load data
    $info = $page->getInfo();
    if(False===$info) exitError($page->lastError);
    // build result
    exitSuccess("Info loaded",$info);
}else if('getProjectInfo'==$cmd){    
    $info = $forum->getProjectInfo();
    if(False===$info) exitError($forum->lastError);
    // build result
    exitSuccess("Info loaded",$info);
}else if('buildFullHTML'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    // load data
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build html
    $html = "";
    $html .= Frontend::buildFullHTML( $forum,$page,$commentsInfo); 
    //
    exitSuccess("",$html);
}else if('getComments'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    // load data
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build html    
    //
    exitSuccess("",$commentsInfo);
}else if('buildCommentsHTML'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    // load data
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build html
    $html = "";
    $html .= Frontend::buildCommentListHTML($page,$commentsInfo); 
    //
    exitSuccess("",$html);
}

// RUN COMMANDS WITH USER CONTEXT
if(""==$forum->sid) exitError("#001.003");

if('addComment'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    if(False===$page->addComment()) exitError($page->lastError);
    // load updated comments
    $commentsInfo = $page->getExtendedComments();
    if(False===$commentsInfo) exitError($page->lastError);
    // build HTML
    $html = "";
    $html .= Frontend::buildCommentListHTML($page,$commentsInfo); 
    //
    exitSuccess("Added new comment",$html);
}else if('removeComment'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    if(False===$page->removeComment()) exitError($page->lastError);
    exitSuccess("Removed comment",""); 
}else if('updateComment'==$cmd){
    $page = $forum->buildPage();
    if($page->lastError!="") exitError($page->lastError);
    if(False===$page->updateComment()) exitError($page->lastError);
    exitSuccess("Comment updated",""); 
}else{
    exitError(ERROR_UNKNOWN_CMD);
}

?>
