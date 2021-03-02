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
        let borderStyle = "border: none;font-size:14px;background-color:#008CBA;color:white;width:100px;height:30px"
        let borderSecStyle = "border: none;font-size:14px;background-color:#e7e7e7; color: black;width:100px;height:30px"
        let textareaStyle = "font-size:14px;width:330px"
        let s = `
    <div id = 'commentForm'  style="display:none;font-size:14px;">
        <div id="user">
            ${comments.user.name}&nbsp<a href="#" onclick="comments.logout();return false;">Logout</a>
            <br/><br/>
        </div>
        <div id="error" style="color:red">
        </div>        
        <div>
            <textarea id="msg" style="${textareaStyle}" rows="5" cols="20" placeholder="New comment"></textarea>
        </div>
        <div id="buttons" style="display: grid; gap:10px;grid-auto-rows: minmax(10px, auto); grid-template-columns: 110px auto">
            <div>
                <input id="send"  style="${borderStyle}" type="button" onclick="comments.commentForm.submit();return false;" value="Send"/>
            </div>
            <div id="addMarker" >
                <input style="${borderSecStyle}" type="button" onclick="comments.commentForm.startMarkerMove();return false" value="Set Marker"/>
            </div>
            <div id="dropMarker" style="display:none">
                <input style="${borderSecStyle}" type="button" onclick="comments.commentForm.stopMarkerMove();return false" value="Drop Marker"/>
            </div>
            <div id="editMarker" style="display:none">
                <input style="${borderSecStyle}" type="button" onclick="comments.commentForm.startMarkerMove();return false" value="Move Marker"/>
                &nbsp;
                <input style="${borderSecStyle}" type="button" onclick="comments.commentForm.dropMarker();return false" value="Drop"/>
            </div>           
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
        $("#comments_viewer #addMarker").hide()
        $("#comments_viewer #dropMarker").show()
        $("#comments_viewer #editMarker").hide()
        //
        this.cursorEnabled = true
        viewer.setMouseMoveHandler(this)
    }
    stopMarkerMove() {
        viewer.currentPage.imageDiv.css("cursor", "")
        viewer.currentPage.imageDiv.off("click")
        viewer.setMouseMoveHandler(null)
        this.cursorEnabled = false
        $("#comments_viewer #addMarker").show()
        $("#comments_viewer #dropMarker").hide()
        $("#comments_viewer #editMarker").hide()
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
        $("#comments_viewer #dropMarker").hide()
        $("#comments_viewer #editMarker").show()
    }
    dropMarker() {
        this.markX = null
        this.markY = null
        commentsViewer.comments.removeCircleOnScene("new")
        //
        $("#comments_viewer #addMarker").show()
        $("#comments_viewer #editMarker").hide()
        $("#comments_viewer #dropMarker").hide()
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
        if ("" != this.sid) {
            this.saveSessionInBrowser()
        }
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
        window.localStorage.setItem("comments-uid", this.uid)
        window.localStorage.setItem("comments-sid", this.sid)
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
    reloadComments() {
        ///
        var formData = new FormData();
        var handler = function () {
            var result = JSON.parse(this.responseText);
            if (comments.processRequestResult(result)) return
            //                        
            if (result.status != 'ok') {
                console.log(result.message)
            } else {
                $("#comments_viewer #comments").html(result.data)
            }
        }
        //    
        return comments.sendCommand("buildCommentsHTML", formData, handler);
    }
    ///////
    build(commentList) {
        this.commentList = commentList
        //        
        if (this.sid != "") {
            this.commentForm.show()
        } else {
            this.loginForm.show()
        }
        this._buildScene()
        this._buildMarkers()
        this._buildComments(commentList)
    }
    //
    _buildComments(commentList) {
        let counterStyle = "font-weight:bold;"
        let visited = commentList['visited']
        //
        let code = ""
        //
        if (commentList['comments'].length > 0) {
            code += `
                <div id="title" style="font-weight:bold;">Comments</div><br/>
            `
        }
        commentList['comments'].forEach(function (comment, counter) {
            ///
            var createdDate = new Date(comment['created'] * 1000)
            var createdStr = createdDate.toLocaleDateString() + " " + createdDate.toLocaleTimeString()
            if (visited < comment['created']) {
                createdStr += "&nbsp;<b>New</b>"
            }
            ///            
            let uid = comment['uid']
            let user = commentList['users'][uid]
            let commentID = comment['id']
            //
            code += `
                <div id="${commentID}" style="font-size:14px;margin-top:10px">
                <div style="display: grid; gap:10px;grid-auto-rows: minmax(10px, auto); grid-template-columns: 10px auto">
                    <div style="${counterStyle}">${counter + 1}</div>
                    <div style="">
                        ${user['name']}<br />${createdStr}<br />${comment['msg']}
                    </div>
                </div>                
            </div>
            `
        }, this)
        $("#comments_viewer #comments").html(code)
    }
    _buildMarkers() {
        this._clearScene()
        let counter = this.commentList['comments'].length
        //
        this.commentList['comments'].reverse().forEach(function (comment) {
            if (undefined != comment['markX']) {
                let uid = comment['uid']
                this.addCircleToScene(uid, comment['markX'], comment['markY'], counter)
            }
            counter--
        }, this)
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
        x = Number(x) - 10
        y = Number(y) - 20
        let code = `
        <svg id="${id}" x="${x}" y="${y}" width="42" height="60">
        <style>
        .small { font: 13px sans-serif; }
        </style>
        <g>        
        <circle cx="25" cy="20" r="10" fill="white"/>
        <text x="25" y="18" dy="0" class="small" dominant-baseline="middle" text-anchor="middle">${number}</text>        
        <path style=" stroke:none;fill-rule:nonzero;fill:rgb(255,79,79);fill-opacity:1;" d="M 25 0 L 25 7.523438 C 30.1875 7.523438 34.394531 11.730469 34.394531 16.917969 C 34.394531 22.105469 30.1875 26.308594 25 26.308594 L 25 50 C 25 50 41.917969 26.257812 41.917969 16.917969 C 41.917969 7.574219 34.34375 0 25 0 Z M 25 0 "/>
        <path style=" stroke:none;fill-rule:nonzero;fill:rgb(255,179,179);fill-opacity:1;" d="M 25 26.308594 C 19.8125 26.308594 15.605469 22.105469 15.605469 16.917969 C 15.605469 11.730469 19.8125 7.523438 25 7.523438 L 25 0 C 15.65625 0 8.082031 7.574219 8.082031 16.917969 C 8.082031 26.257812 25 50 25 50 Z M 25 26.308594 "/>
        </g>
        </svg>
        `
        //    `<circle id="${id}" cx="${x}" cy="${y}" r="${r}" stroke="black" stroke-width="3" fill="red"/>`
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
        this._buildMarkers()
    }
    hideViewer() {
        if (this.currentForm) this.currentForm.hideViewer()
        this._dropScene()
    }
}