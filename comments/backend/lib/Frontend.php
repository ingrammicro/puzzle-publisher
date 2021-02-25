<?php

class Frontend
{   
    public static function buildFullHTML(&$forum,&$page,&$commentsInfo){
        $url =  ($_SERVER['HTTPS']=="on"?"https://":"http://").$_SERVER['SERVER_NAME'].":".$_SERVER['SERVER_PORT'].$_SERVER['SCRIPT_NAME'];
        //var_dump($_SERVER);
        $inputStyle=' style="font-size:12px;"' ;
        $code = file_get_contents("lib/Comments.js");
        $userInfo = json_encode($forum->user);
        $codePrerun = (http_post_param("sid")!="" && ""==$forum->sid)?"comments.clearSession()":"";        
        $commentList = json_encode($commentsInfo);

        $res = <<<EOL
        <div id="top"/>
EOL;
        $res .= "<br/><div id='comments'></div>";
        $res .= <<<EOL
        <script>    
            {$code}            
            let comments = new Comments("{$forum->forumID()}","{$url}","{$forum->sid}",{$userInfo});
            {$codePrerun}            
            comments.build(${commentList});            
        //
        </script>        
EOL;
        return $res;
    }

    public static function buildCommentListHTML(&$page,&$commentsInfo){
        $commentList = json_encode($commentsInfo);
        $res = <<<EOL
        <script>                          
            comments.build(${commentList});            
        //
        </script>        
EOL;
        return $res;
    }

}

?>