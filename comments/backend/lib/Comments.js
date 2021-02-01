class CommentsAbstractForm {
    constructor(formName) {
        this.formName = formName
        this.built = false
        //
        this.inputStyle = ' style="font-size:12px;"'
    }
    _tuneInput(inputName) {
        let input = $("#comments_viewer #" + this.formName + " #" + inputName)
        input.focusin(function () {
            comments.inputFocused = true
        })
        input.focusout(function () {
            comments.inputFocused = false
        })
    }
    _setInputValue(inputName, value) {
        let input = $("#comments_viewer #" + this.formName + " #" + inputName)
        input.val(value);
        return input
    }
    showError(errorText) {
        $("#comments_viewer #" + this.formName + " #error").html(errorText);
    }
    show() {
        if (!this.built) this.buildHTML();
        this.putDataInForm()
        $("#comments_viewer #" + this.formName).show()
    }
    hide() {
        $("#comments_viewer #" + this.formName).hide()
    }
    //// to overwrite
    buildHTML() {
        this.built = true
    }
    getDataFromForm() {

    }
    putDataInForm() { }
    checkData() { }
    handleEnterKey() {
        return false
    }
    clear() {
        this.putDataInForm()
    }
    submit() { }
}
////////////////// LOGIN FORM /////////
class CommentsLoginForm extends CommentsAbstractForm {
    constructor() {
        super("loginForm")
        this.email = ""
    }
    putDataInForm() {
        this._setInputValue("email", this.email);
    }
    // Check data
    checkData() {
        if ("" == this.email) {
            this.showError("Specify email");
            return false;
        }
        return true
    }
    getDataFromForm() {
        this.email = $("#comments_viewer #loginForm #email").val();
    }
    buildHTML() {
        super.buildHTML()
        let s = `
    <div id='loginForm' style="display:none">
        <div id="title" style="font-weight:bold;">Login As</div>
        <div id="error" style="color:red"></div>
        <div>
            <input id="email" ${this.inputStyle} placeholder="Your email" />
        </div>
        <div id="buttons">
            <input id="send" type="button" onclick="comments.loginForm.submit();return false;" value="Login" />
        </div>
    </div>`
        $("#comments_viewer #top").append(s);
        this._tuneInput("email")
    }
    submit() {
        this.getDataFromForm();
        if (!this.checkData()) return false;
        ///
        var formData = new FormData();
        formData.append("email", this.email);
        //
        var handler = function () {
            var form = comments.loginForm
            var result = JSON.parse(this.responseText);
            if (comments.processRequestResult(result)) return
            //
            console.log(this.responseText);
            if (result.status != 'ok') {
                form.showError(result.message);
            } else {
                console.log(result);
                comments.authForm.userExists = result.data.exists;
                form.hide()
                comments.authForm.show()
            }
        }
        //
        return comments.sendCommand("login", formData, handler);
    }
    clear() {
        this.email = ""
        super.clear()
    }

}
////////////////// AUTH FORM /////////
class CommentsAuthForm extends CommentsAbstractForm {
    constructor() {
        super("authForm")
        this.code = ""
        this.name = ""
        this.userExists = false
    }
    putDataInForm() {
        this._setInputValue("code", this.code)
        let nameField = this._setInputValue("name", this.name)
        if (this.userExists)
            nameField.hide()
        else
            nameField.show()

    }
    // Check data
    checkData() {
        if ("" == this.code) {
            this.showError("Specify code");
            return false;
        }
        return true
    }
    getDataFromForm() {
        this.code = $("#comments_viewer #authForm #code").val();
        this.name = $("#comments_viewer #authForm #name").val();
    }
    buildHTML() {
        super.buildHTML()
        let s = `
    <div id='authForm' style="display:none">        
        <div id="title" style="font-weight:bold;">Confirm login</div>
        <div id="msg">
            Check new email to get a code
        </div>
        <div id="error" style="color:red"></div> 
        <div>
            <input id="name" ${this.inputStyle} placeholder="Your name" />
        </div>
        <div>
            <input id="code" ${this.inputStyle} placeholder="Authorization code" />
        </div>
        <div id="buttons">
            <input id="send" type="button" onclick="comments.authForm.submit();return false;" value="Confirm" />
            <input id="send" type="button" onclick="comments.authForm.cancel();return false;" value="Cancel" />
        </div>
    </div>`
        $("#comments_viewer #top").append(s);
        this._tuneInput("code")
        this._tuneInput("name")
    }
    cancel() {
        this.clear()
        this.hide()
        comments.loginForm.show()
    }
    submit() {
        this.getDataFromForm();
        if (!this.checkData()) return false;
        ///
        var formData = new FormData();
        formData.append("code", this.code);
        formData.append("name", this.name);
        formData.append("email", comments.loginForm.email);
        //
        var handler = function () {
            var form = comments.authForm
            var result = JSON.parse(this.responseText);
            if (comments.processRequestResult(result)) return
            //                        
            console.log(this.responseText);
            if (result.status != 'ok') {
                if ("#010.003" == result.errorCode) {
                    form.showError("Authorization code is wrong");
                } else {
                    form.showError(result.message);
                }
            } else {
                comments.sid = result.data.sid
                comments.uid = result.data.uid
                comments.user = result.data.user

                comments.saveSessionInBrowser()

                console.log(result);
                form.hide()
                comments.commentForm.show()
            }
        }
        //    
        return comments.sendCommand("auth", formData, handler);
    }
    clear() {
        this.code = ""
        this.name = ""
        this.email = ""
        super.clear()
    }

}
////////////////// COMMENT FORM /////////
class CommentsCommentForm extends CommentsAbstractForm {
    constructor() {
        super("commentForm")
        this.msg = ""
    }
    putDataInForm() {
        this._setInputValue("msg", this.msg)
    }
    // Check data
    checkData() {
        if ("" == this.msg) {
            this.showError("Specify message");
            return false;
        }
        return true
    }
    getDataFromForm() {
        this.msg = $("#comments_viewer #commentForm #msg").val();
    }
    buildHTML() {
        super.buildHTML()
        let s = `
    <div id = 'commentForm'  style="display:none">
        <div id="user">
            ${comments.user.name}&nbsp<a href="#" onclick="comments.logout();return false;">Logout</a>
        </div>
        <div id="title" style="font-weight:bold;">Add comment</div>
        <div id="error" style="color:red">
        </div>
        <div>
            <textarea id="msg" ${this.inputStyle} rows="5" cols="20" placeholder="Text"></textarea>
        </div>
        <div id="buttons">
            <input id="send" type="button" onclick="comments.commentForm.submit();return false;" value="Send"/>
        </div>
    </div>`
        $("#comments_viewer #top").append(s);
        this._tuneInput("msg")
    }
    submit() {
        this.getDataFromForm();
        if (!this.checkData()) return false;
        ///
        var formData = new FormData();
        formData.append("msg", this.msg);
        //
        var handler = function () {
            var form = comments.loginForm
            var result = JSON.parse(this.responseText);
            if (comments.processRequestResult(result)) return
            //                        
            console.log(this.responseText)
            if (result.status != 'ok') {
                form.showError(result.message)
            } else {
                console.log(result)
                form.clear()
                $("#comments_viewer #comments").html(result.data)
            }
        }
        //    
        return comments.sendCommand("addComment", formData, handler);
    }
    clear() {
        this.msg = ""
        this.showError("")
        super.clear()
    }
}
////
class Comments {
    constructor(forumID, url, sid, user) {
        this.forumID = forumID
        this.url = url

        // load user data from browser storage   
        this.sid = sid
        this.uid = user.uid
        this.user = user

        //
        this.loginForm = new CommentsLoginForm()
        this.authForm = new CommentsAuthForm()
        this.commentForm = new CommentsCommentForm()
        //
        this.inputFocused = false
    }
    clearSession() {
        this.uid = ""
        this.sid = ""
        this.user = []
        this.saveSessionInBrowser()
        this.loginForm.clear()
        this.authForm.clear()
        this.commentForm.clear()
        //
        this.commentForm.hide()
        this.loginForm.show()
    }
    saveSessionInBrowser() {
        window.localStorage.setItem("comments-uid", comments.uid)
        window.localStorage.setItem("comments-sid", comments.sid)
    }
    processRequestResult(result) {
        console.log(result)

        if (
            ("ok" == result.status && result.dropSession)
            ||
            ("error" == result.status && "#001.003" == result.errorCode)
        ) {
            this.clearSession()
        } else
            return false
        return true
    }
    ///
    sendCommand(cmd, formData, handler) {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', this.url + "?fid=" + this.forumID + "&cmd=" + cmd, true)
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onload = handler
        if ("" != this.uid && "" != this.sid) {
            formData.append("uid", this.uid);
            formData.append("sid", this.sid);
        }
        xhr.send(formData);
    }
    ///////
    logout() {
        var formData = new FormData();
        var handler = function () {
            console.log(this.responseText)
            comments.clearSession()
        }
        //    
        return this.sendCommand("logout", formData, handler);
    }
    ////////
    run() {
        //
        //
        if (this.sid != "") {
            this.commentForm.show()
        } else {
            this.loginForm.show()
        }
    }
}