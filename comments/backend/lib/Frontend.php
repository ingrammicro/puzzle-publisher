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
EOL;
        $res .= "<br/><div id='comments'>" . Frontend::buildCommentListHTML($page,$commentsInfo)."</div>";
        $res .= <<<EOL
        <script>    
            {$code}            
            comments = new Comments("{$forum->forumID()}","{$url}","{$forum->sid}",{$userInfo});
            {$codePrerun}            
            comments.run();
        </script>        
EOL;
        return $res;
    }

    public static function buildCommentListHTML(&$page,&$commentsInfo){
        $res = "";
        $prevItem = null;
        $counter=1;
        //
        $circleStyle = "border-radius: 50%; width: 24px;height: 24px; padding: 6px; background: #fff; border: 2px solid #666; color: #666; text-align: center;";
        //
        foreach(array_reverse($commentsInfo['comments']) as &$comment){
            if(null==$prevItem){
                $res .= <<<EOL
                <div id="title" style="font-weight:bold;">Comments</div><br/>
EOL;
            }else{
                $res .= "<br/>";
            }
            ///            
            $user = $commentsInfo['users'][$comment['uid']];
            $commentID = $comment['created']."-".$comment['uid'];
            //
            $res .= <<<EOL
            <div id="{$commentID}" style="font-size:14px;">                
                <div style="display: grid; gap:10px;grid-auto-rows: minmax(30px, auto); grid-template-columns: 40px auto">
                    <div style="{$circleStyle}">{$counter}</div>
                    <div style="">
                        {$user['name']}<br/>{$comment['created']}<br/>{$comment['msg']}
                    </div>
                </div>                
            </div>
EOL;
            // finalize item
            $prevItem = $comment;
            $counter++;
        }
        //
        return $res;
    }

}

?>