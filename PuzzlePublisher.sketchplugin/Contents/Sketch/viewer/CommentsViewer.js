
class CommentsViewer extends AbstractViewer {
    constructor() {
        super()

        this.inputFocused = false
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

    _showComments() {
        var formData = new FormData();
        //
        var uid = window.localStorage.getItem("comments-uid")
        var sid = window.localStorage.getItem("comments-sid")
        if (null != uid && null != sid) {
            formData.append("uid", uid);
            formData.append("sid", sid);
        }
        formData.append("cmd", buildFullHTML);
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
        viewer.refresh_url(viewer.currentPage, "", false)
    }

    _showLoadingMessage() {
        $("#comments_viewer_content").html("Loading...")
    }
}
