<?php

class Frontend
{   
    public static function buildCommentsHTML($page,$commentsInfo){
        $res = "";
        //
        $res .= `        
        <div class='commentUser'>
        `;
        //
        foreach($commentsInfo['comments'] as &$comment){
            $user = &$commentsInfo['users'][$comment['uid']];          
            //
            $res .= "<div class='name'>".$user['name']."</div>";
            $res .= "<div class='posted'>".$comment['created']."</div>";
            $res .= "<div class='msg'>".$comment['msg']."</div>";
        }
        //
        $res .= `        
        </div>
        `;
        return $res;
    }

}

?>

