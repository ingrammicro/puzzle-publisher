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

        $res = <<<EOL
        <div id="top"/>
        <script>    
            {$code}            
            comments = new Comments("{$forum->forumID()}","{$url}","{$forum->sid}",{$userInfo});
            {$codePrerun}            
            comments.run();
        </script>        
EOL;
        $res .= "<div id='comments'>" . Frontend::buildCommentListHTML($page,$commentsInfo)."</div>";
        return $res;
    }

    public static function buildCommentListHTML(&$page,&$commentsInfo){
        $res = "";
        //
        $prevItem = null;
        //
        foreach(array_reverse($commentsInfo['comments']) as &$comment){
            if(null==$prevItem){
                $res .= <<<EOL
                <div id="title" style="font-weight:bold;">Comments</div>
EOL;
            }else{
                $res .= "<br/>";
            }
            ///            
            $user = $commentsInfo['users'][$comment['uid']];
            $commentID = $comment['created']."-".$comment['uid'];
            //
            $res.=<<<EOL
            <div id='{$commentID}' style="font-size:12px;">
EOL;
            //
            $res .= "<div class='name'>".$user['name']."</div>";
            $res .= "<div class='posted'>".$comment['created']."</div>";
            $res .= "<div class='msg'>".$comment['msg']."</div>";
            // finalize item
            $res.="</div>";
            $prevItem = $comment;
        }
        //
        return $res;
    }

}

?>

