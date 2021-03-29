
let commentsViewer = null;

class CommentsViewer extends AbstractViewer {
    constructor() {
        super()

        this.alwaysHandlePageChanged = true

        this.comments = null
        this.inputFocused = false
        commentsViewer = this
    }

    initialize(force = false) {
        if (!force && this.inited) return

        this._showLoadingMessage()
        this._showComments();

        this.inited = true
    }

    ///////////////////////////////////////////////// called by Viewer


    _hideSelf() {
        $('#comments_viewer').addClass("hidden")
        super._hideSelf()
        viewer.refresh_url(viewer.currentPage, "", false)
        viewer.currentPage.linksDiv.children("a").show()
        this.comments.hideViewer()
    }

    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (67 == event.which) { // c
            // Key "C" activates self
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }

    pageChanged() {
        this._showCommentCounter()
        if (!this.visible) {
            return
        }
        if (!this.inited) return this.initialize();
        comments.reloadComments()
    }



    handleKeyDown(jevent) {
        const event = jevent.originalEvent

        if (27 == event.which) { // esc
            this.toggle()
        } else if (!comments.inputFocused && 67 == event.which) { // key "g"
            // Key "G" deactivates Symbol Viewer
            this.toggle()
        } else if (comments.inputFocused) {
            return true
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }
    /////////////////////////////////////////////////

    askCommentCounters(handler) {
        var formData = new FormData();
        this.sendRequest(formData, "getProjectInfo", handler)
    }

    _showCommentCounter() {
        var formData = new FormData();
        this.sendRequest(formData, "getPageInfo", function () {
            var result = JSON.parse(this.responseText);
            //
            if ("ok" == result.status) {
                commentsViewer.updateCommentCounter(result.data.commentsTotal)
            } else {
                console.log(result.message);
            }
            return

        })
        /*
            var xhr = new XMLHttpRequest();
            xhr.open("POST", story.commentsURL + "&cmd=getPageInfo", true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.onload = function () {
                var result = JSON.parse(this.responseText);
                //
                if ("ok" == result.status) {
                    commentsViewer.updateCommentCounter(result.data.commentsTotal)
                } else {
                    console.log(result.message);
                }
                return
    
            };
            xhr.send(formData);
            */
    }

    sendRequest(formData, cmd, handler) {
        var xhr = new XMLHttpRequest()
        xhr.open("POST", story.commentsURL + "&cmd=" + cmd, true)
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.onload = handler
        xhr.send(formData)
    }

    updateCommentCounter(total) {
        var div = $('#nav #pageComments #counter')
        if (total > 0) {
            div.html(total);
            div.show()
        } else {
            div.hide()
        }
    }

    _showComments() {
        var formData = new FormData();
        //
        var uid = window.localStorage.getItem("comments-uid")
        var sid = window.localStorage.getItem("comments-sid")
        if (null != uid && null != sid) {
            formData.append("uid", uid);
            formData.append("sid", sid);
        }
        //
        var xhr = new XMLHttpRequest();
        xhr.open("POST", story.commentsURL + "&cmd=buildFullHTML", true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onload = function () {
            var result = JSON.parse(this.responseText);
            //
            if ("ok" == result.status) {
                $('#comments_viewer_content').html(result.data);
            } else {
                $('#comments_viewer_content').html(result.message);
            }
            return

        };
        xhr.send(formData);
    }


    _showSelf() {
        if (!this.inited) this.initialize()
        $('#comments_viewer').removeClass("hidden")
        super._showSelf()
        //
        viewer.refresh_url(viewer.currentPage, "", false)
        viewer.currentPage.linksDiv.children("a").hide()
        //
        if (this.comments) this.comments.showViewer()
    }

    _showLoadingMessage() {
        $("#comments_viewer_content").html("Loading...")
    }
}
