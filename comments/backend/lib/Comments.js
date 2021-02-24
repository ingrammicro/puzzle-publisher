class CommentsAbstractForm {
    constructor(formName) {
        this.formName = formName
        this.built = false
        //
        this.inputStyle = ' style="font-size:12px;"'
    }
    _tuneInput(inputName, type = "input") {
        let input = $("#comments_viewer #" + this.formName + " #" + inputName)
        input.focusin(function () {
            comments.inputFocused = true
        })
        input.focusout(function () {
            comments.inputFocused = false
        })
        if ("input" == type) {
            input.keypress(function (e) {
                if (e.which == 13) {
                    comments.currentForm.submit()
                }
            });
        } else if ("textarea" == type) {
            input.keypress(function (e) {
                if (e.which == 13 && e.metaKey) {
                    comments.currentForm.submit()
                }
            });
        }
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
        comments.currentForm = this
    }
    hide() {
        $("#comments_viewer #" + this.formName).hide()
        this.showError("")

    }
    showViewer() {
    }
    hideViewer() {
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
        if (!this.userExists && "" == this.name) {
            this.showError("Specify your name");
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
            <input id="code" ${this.inputStyle} placeholder="Authorization code" />
        </div>
        <div>
            <input id="name" ${this.inputStyle} placeholder="Your name" />
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
        this.cursorEnabled = false
        this.markX = null
        this.markY = null
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
            <br/><br/>
        </div>
        <div id="error" style="color:red">
        </div>
        <div id="addMarker" >
            <a href="#" onclick="comments.commentForm.startMarkerMove();return false">Add marker</a>
        </div>
        <div id="editMarker" style="display:none">
            <a href="#" onclick="comments.commentForm.startMarkerMove();return false">Move marker</a>
            &nbsp;
            <a href="#" onclick="comments.commentForm.dropMarker();return false">Drop </a>
        </div>
        <div>
            <textarea id="msg" ${this.inputStyle} rows="5" cols="20" placeholder="New comment"></textarea>
        </div>
        <div id="buttons">
            <input id="send" type="button" onclick="comments.commentForm.submit();return false;" value="Send"/>
        </div>
    </div>`
        $("#comments_viewer #top").append(s);
        this._tuneInput("msg", "textarea")
    }
    startMarkerMove() {
        //
        if (null != this.markX) {
            commentsViewer.comments.removeCircleOnScene("new")
            this.markX = null
            this.markY = null
        }
        //
        viewer.currentPage.imageDiv.css("cursor", "url('resources/cursormap.png'), auto")
        viewer.currentPage.imageDiv.click(function () {
            commentsViewer.comments.commentForm.saveMarker()
        })
        //
        this.cursorEnabled = true
        viewer.setMouseMoveHandler(this)
    }
    stopMarkerMove() {
        viewer.currentPage.imageDiv.css("cursor", "")
        viewer.currentPage.imageDiv.off("click")
        viewer.setMouseMoveHandler(null)
        this.cursorEnabled = false
    }
    onMouseMove(x, y) {
        this.x = Math.round(x / viewer.currentZoom) - viewer.currentPage.currentLeft
        this.y = Math.round(y / viewer.currentZoom) - viewer.currentPage.currentTop
    }
    saveMarker() {
        this.stopMarkerMove()
        //
        this.markX = this.x
        this.markY = this.y
        //
        commentsViewer.comments.addCircleToScene("new", this.markX, this.markY)
        $("#comments_viewer #addMarker").hide()
        $("#comments_viewer #editMarker").show()
    }
    dropMarker() {
        this.markX = null
        this.markY = null
        commentsViewer.comments.removeCircleOnScene("new")
        //
        $("#comments_viewer #addMarker").show()
        $("#comments_viewer #editMarker").hide()
    }
    submit() {
        this.getDataFromForm();
        if (!this.checkData()) return false;
        ///
        var formData = new FormData();
        formData.append("msg", this.msg);
        formData.append("pageOwnerName", story.authorName);
        formData.append("pageOwnerEmail", story.authorEmail);
        if (null != this.markX) {
            formData.append("markX", this.markX);
            formData.append("markY", this.markY);
        }
        //
        var handler = function () {
            var form = comments.commentForm
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
        this.dropMarker()
        this.showError("")
        super.clear()
    }
    hide() {
        if (this.cursorEnabled) this.stopMarkerMove()
        super.hide()
    }
    hideViewer() {
        if (this.cursorEnabled) this.stopMarkerMove()
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
        this.commentList = null
        //
        this.currentForm = null
        this.loginForm = new CommentsLoginForm()
        this.authForm = new CommentsAuthForm()
        this.commentForm = new CommentsCommentForm()
        //
        this.inputFocused = false
        commentsViewer.comments = this
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
    build(commentList) {
        this.commentList = commentList
        //        
        if (this.sid != "") {
            this.commentForm.show()
        } else {
            this.loginForm.show()
        }
        this._buildScene()
        this._buildComments(commentList)
    }
    //
    _buildComments(commentList) {
        let circleStyle = "border-radius: 50%; width: 24px;height: 24px; padding: 6px; background: #fff; border: 2px solid #666; color: #666; text-align: center;"
        //
        this._clearScene()
        let code = ""
        let prevItem = null
        let counter = 1;
        //
        commentList['comments'].reverse().forEach(function (comment) {
            if (null == prevItem) {
                code += `
                <div id="title" style="font-weight:bold;">Comments</div><br/>
                `
            } else {
                code += "<br/>"
            }
            ///            
            let uid = comment['uid']
            let user = commentList['users'][uid]
            let commentID = comment['created'] + "-" + uid
            //
            code += `
                <div id="${commentID}" style="font-size:14px;">
                <div style="display: grid; gap:10px;grid-auto-rows: minmax(30px, auto); grid-template-columns: 40px auto">
                    <div style="${circleStyle}">${counter}</div>
                    <div style="">
                        ${user['name']}<br />${comment['created']}<br />${comment['msg']}
                    </div>
                </div>                
            </div>
            `
            //
            if (undefined != comment['markX']) {
                this.addCircleToScene(uid, comment['markX'], comment['markY'], counter)
            }
            // finalize item
            prevItem = comment
            counter++
        }, this)
        $("#comments_viewer #comments").html(code)
    }
    //
    _buildScene() {
        this._dropScene()
        //
        let page = viewer.currentPage
        let width = page.imageDiv.width()
        let height = page.imageDiv.height()

        let code = `<div id="commentsScene"><svg height="${height}" width="${width}">           
        </svg>
        </div>`
        page.linksDiv.append(code)
        //        
    }
    addCircleToScene(id, x, y, number = "") {
        let r = 20
        x += r / 2
        y += r / 2
        let code =
            `<circle id="${id}" cx="${x}" cy="${y}" r="${r}" stroke="black" stroke-width="3" fill="red"/>`
        $('#commentsScene svg').append(code)
        $('#commentsScene').html($('#commentsScene').html())
    }
    removeCircleOnScene(id) {
        $('#commentsScene svg #' + id).remove()
    }
    _dropScene() {
        $('#commentsScene').remove()
    }
    _clearScene() {
        $('#commentsScene svg').html("")
    }
    //
    showViewer() {
        this._buildScene()
    }
    hideViewer() {
        if (this.currentForm) this.currentForm.hideViewer()
        this._dropScene()
    }
}