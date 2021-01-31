<?php

class Frontend
{   
    public static function buildFullHTML(&$forum,&$page,&$commentsInfo){
        $url =  ($_SERVER['HTTPS']=="on"?"https://":"http://").$_SERVER['SERVER_NAME'].":".$_SERVER['SERVER_PORT'].$_SERVER['SCRIPT_NAME'];
        //var_dump($_SERVER);
        $inputStyle=' style="font-size:12px;"' ;
        $res = <<<EOL
        <div id="top"/>
        <script>    
            class CommentsAbstractForm{
                constructor(formName){                    
                    this.formName = formName
                    this.built = false
                }
                _tuneInput(input){
                    input.focusin(function () {
                        comments.inputFocused = true
                    })
                    input.focusout(function () {
                        comments.inputFocused = false
                    })
                }
                showError(errorText) {
                    $("#comments_viewer #"+this.formName + "#error").html(errorText);
                }
                show(){
                    if(!this.built) this.buildHTML();
                    this.putDataInForm()
                    $("#comments_viewer #"+this.formName).show()                    
                }
                hide(){
                    $("#comments_viewer #"+this.formName).hide()
                }
                //// to overwrite
                buildHTML(){
                    this.built = true
                }
                getDataFromForm(){
                }
                putDataInForm(){
                }
                checkData(){
                }
                handleEnterKey(){
                    return false
                }    
                submit(){
                }            
            }
            ////////////////// LOGIN FORM /////////
            class CommentsLoginForm extends CommentsAbstractForm{
                constructor(){
                    super("loginForm")
                    this.email = ""                                        
                }
                putDataInForm(){
                    let emailField = $("#comments_viewer #loginForm #email")
                    emailField.val(this.email);
                    this._tuneInput(emailField)    
                }
                // Check data
                checkData(){
                    if(""==this.email){
                        this.showError("Specify email");
                        return false;
                    }
                    return true
                }  
                getDataFromForm(){
                    this.email = $("#comments_viewer #loginForm #email").val();              
                }
                buildHTML(){
                    super.buildHTML()
                    let s=`
        <div id='loginForm'>
            <div id="title" style="font-weight:bold;">Login As</div>
            <div id="error" style="color:red">
            </div>
            <div>
                <input id="email" {$inputStyle} placeholder="Your email"/>
            </div>
            <div id="buttons">
                <input id="send" type="button" onclick="comments.loginForm.submit();return false;" value="Login"/>
            </div>
        </div>`
                    $("#comments_viewer #top").append(s);
                }
                submit(){
                    this.getDataFromForm();                    
                    if(!this.checkData()) return false;
                    ///
                    var formData = new FormData();
                    formData.append("email",  this.email);                  
                    //
                    var handler =function () {
                        var form = comments.loginForm
                        var result =  JSON.parse(this.responseText);
                        //                        
                        console.log(this.responseText); 
                        if(result.status!='ok'){
                            form.showError(result.message);
                        }else{
                            console.log(result); 
                            form.hide()
                            comments.authForm.show()
                        }
                    }                
                    //    
                    return comments.sendCommand("login", formData,handler);
                }

            }
            ////////////////// AUTH FORM /////////
            class CommentsAuthForm extends CommentsAbstractForm{
                constructor(){
                    super("authForm")
                    this.code = ""                                        
                }
                putDataInForm(){
                    let codeField = $("#comments_viewer #authForm #code")
                    codeField.val(this.code);
                    this._tuneInput(codeField)    
                }
                // Check data
                checkData(){
                    if(""==this.code){
                        this.showError("Specify code");
                        return false;
                    }
                    return true
                }  
                getDataFromForm(){
                    this.code = $("#comments_viewer #authForm #code").val();              
                }
                buildHTML(){
                    super.buildHTML()
                    let s=`
                <div id='authForm' style="display:none">
                    <div id="msg>
                        Check new email to get a code
                    </div>
                    <div id="title" style="font-weight:bold;">Confirm login</div>
                    <div id="error" style="color:red"></div>        
                    <div>
                        <input id="code" {$inputStyle} placeholder="Authorization code"/>
                    </div>
                    <div id="buttons">
                        <input id="send" type="button" onclick="comments.authForm.submit();return false;" value="Login"/>
                    </div>
                </div>`
                    $("#comments_viewer #top").append(s);
                }
                submit(){
                    this.getDataFromForm();                    
                    if(!this.checkData()) return false;
                    ///
                    var formData = new FormData();
                    formData.append("code",  this.code);                  
                    //
                    var handler =function () {
                        var form = comments.authForm
                        var result =  JSON.parse(this.responseText);
                        //                        
                        console.log(this.responseText); 
                        if(result.status!='ok'){
                            form.showError(result.message);
                        }else{
                            console.log(result); 
                            form.hide()
                            comments.commentForm.show()
                        }
                    }                
                    //    
                    return comments.sendCommand("checkAuth", formData,handler);
                }

            }
            ////
            class Comments {
                constructor() {
                    this.forumID = "{$forum->forumID()}"
                    this.url = "{$url}"

                    // load user data from browser storage   
                    this.uid = "{$forum->uid}";
                    this.comment={
                        name:"",
                        email:"",
                        msg:"" 
                    }                
                    //
                    this.loginForm =new CommentsLoginForm()
                    this.authForm = new CommentsAuthForm()
                    //
                    this.inputFocused = false                                       
                }                        
                sendCommand(cmd,formData,handler) {
                    var xhr = new XMLHttpRequest()                    
                    xhr.open('POST',this.url + "?fid="+this.forumID+"&cmd="+cmd, true)
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    xhr.onload = handler
                    formData.append("uid", this.uid);
                    xhr.send(formData);
                }
                //// UI
                readComment(){
                    this.comment.name = $("#comments_viewer #commentForm #nameField").val();
                    this.comment.email = $("#comments_viewer #commentForm #emailField").val();
                    this.comment.msg = $("#comments_viewer #commentForm #msgField").val();
                    //
                    if(this.comment.name!="") window.localStorage.setItem("commentsUserName", this.comment.name)
                    if(this.comment.email!="") window.localStorage.setItem("commentsUserEmail", this.comment.email)
                }
                fillComment(){
                    let nameField = $("#comments_viewer #commentForm #nameField")
                    nameField.val(this.comment.name);
                    this._tuneInput(nameField)
                    
                    let emailField = $("#comments_viewer #commentForm #emailField")
                    emailField.val(this.comment.email);
                    this._tuneInput(emailField)
                 
                    let msgField = $("#comments_viewer #commentForm #msgField")
                    msgField.val(this.comment.msg);
                    this._tuneInput(msgField)                   
                }            
                // Check data
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
                            this.showError(result.message);
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
                            this.showError(result.message);
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
                ////////
                run(){
                    if(this.uid!=""){
                    }else{
                        this.loginForm.show()
                    }
                }
            }
            comments = new Comments();
            comments.run()
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

    public static function buildCommentFormHTML(&$page){
        $res = "";
        //
        $inputStyle=' style="font-size:12px;"' ;
        //
        $res .= <<<EOL
        <div id='commentForm'>
            <div id="title" style="font-weight:bold;">Add comment</div>
            <div id="error" style="color:red">
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

