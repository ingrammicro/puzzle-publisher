<?php

class Frontend
{   
    public static function buildFullHTML(&$forum,&$page,&$commentsInfo){
        $url =  ($_SERVER['HTTPS']=="on"?"https://":"http://").$_SERVER['SERVER_NAME'].":".$_SERVER['SERVER_PORT'].$_SERVER['SCRIPT_NAME'];
        //var_dump($_SERVER);
        $res = <<<EOL
        <script>
            class Comments {
                constructor() {
                    this.forumID = "{$forum->forumID()}"
                    this.url = "{$url}"

                    // load user data from browser storage   
                    let name = window.localStorage.getItem("commentsUserName")
                    let email = window.localStorage.getItem("commentsUserEmail")
                    this.comment={
                        name:name!=null?name:"", 
                        email:email!=null?email:"",
                        msg:""
                    }
                    this.inputFocused = false                   
                }
                showError(errorText) {
                    $("#comments_viewer #newForm #error").html(errorText);
                }
                sendCommand(cmd,formData,handler) {
                    var xhr = new XMLHttpRequest()
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    xhr.open('POST',this.url + "?fid="+this.forumID+"&cmd="+cmd, true)
                    xhr.onload = handler
                    xhr.send(formData);
                }
                //// UI
                readComment(){
                    this.comment.name = $("#comments_viewer #newForm #nameField").val();
                    this.comment.email = $("#comments_viewer #newForm #emailField").val();
                    this.comment.msg = $("#comments_viewer #newForm #msgField").val();
                    //
                    if(this.comment.name!="") window.localStorage.setItem("commentsUserName", this.comment.name)
                    if(this.comment.email!="") window.localStorage.setItem("commentsUserEmail", this.comment.email)
                }
                fillComment(){
                    let nameField = $("#comments_viewer #newForm #nameField")
                    nameField.val(this.comment.name);
                    nameField.focusin(function () {
                        comments.inputFocused = true
                    })
                    nameField.focusout(function () {
                        comments.inputFocused = false
                    })
                    
                    let emailField = $("#comments_viewer #newForm #emailField")
                    emailField.val(this.comment.email);
                    emailField.focusin(function () {
                        comments.inputFocused = true
                    })
                    emailField.focusout(function () {
                        comments.inputFocused = false
                    })

                    let msgField = $("#comments_viewer #newForm #msgField")
                    msgField.val(this.comment.msg);
                    msgField.focusin(function () {
                        comments.inputFocused = true
                    })
                    msgField.focusout(function () {
                        comments.inputFocused = false
                    })

                }
                checkComment(){
                    if(""==this.comment.name || ""==this.comment.email || ""==this.comment.msg){
                        this.showError("Specify name, email and message");
                        return false;
                    }
                    return true
                }                
                //                   
                submitComment(){
                    this.readComment();                    
                    if(!this.checkComment()) return false;
                    ///
                    var formData = new FormData();
                    formData.append("pageOwnerName", story.authorName);
                    formData.append("pageOwnerEmail", story.authorEmail);
                    //
                    formData.append("name", this.comment.name);
                    formData.append("email", this.comment.email);
                    formData.append("msg", this.comment.msg);
                    //
                    var handler =function () {
                        var result =  JSON.parse(this.responseText);
                        //                        
                        console.log(this.responseText); 
                        if(result.status!='ok'){
                            comments.showError(result.message);
                        }else{
                            console.log(result); 
                            $("#comments_viewer #comments").html(result.data);
                            comments.comment.msg = ""
                            comments.fillComment()
                        }
                    }                
                    //    
                    return comments.sendCommand("addComment", formData,handler);
                }
                reloadComments(){
                    $("#comments_viewer #comments").html("Loading...");
                    var handler =function () {
                        var result =  JSON.parse(this.responseText);
                        //
                        if(result.status!='ok'){
                            comments.showError(result.message);
                        }else{
                            $("#comments_viewer #comments").html(result.data);
                            comments.comment.msg = ""
                            comments.fillComment()
                        }
                    }                
                    //    
                    var formData = new FormData();
                    return comments.sendCommand("buildCommentsHTML", formData,handler);
                }
            }
            comments = new Comments();
        </script>
EOL;
        //        
        $res .= Frontend::buildCommentFormHTML($page);
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

    public static function buildCommentFormHTML(&$page){
        $res = "";
        //
        $inputStyle=' style="font-size:12px;"' ;
        //
        $res .= <<<EOL
        <div id='newForm'>
            <div id="title" style="font-weight:bold;">Add comment</div>
            <div id="error" style="color:red">
            </div>
            <div id="name">
                <input id="nameField" {$inputStyle} placeholder="Your name" style="font-size:12px;"/>
            </div>
            <div id="email">
                <input id="emailField" {$inputStyle} placeholder="Your email"/>
            </div>
            <div id="msg">
                <textarea id="msgField" {$inputStyle} rows="5" cols="20" placeholder="Text"></textarea>
            </div>
            <div id="buttons">
                <input id="send" type="button" onclick="comments.submitComment();return false;" value="Send"/>
            </div>
        </div>
        <br/>
        <script>
            comments.fillComment();
        </script>
EOL;
        return $res;
    }

}

?>

