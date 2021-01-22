function getVersionInfoRequest() {
    var resp = this
    if (resp.readyState == resp.DONE) {
        if (resp.status == 200 && resp.responseText != null) {
            const data = JSON.parse(resp.responseText)
            if (undefined != data['time']) {
                viewer.versionViewer._loadData(data);
                return true
            }
        }
        showError("Can't get information about the versions.")
    }
    return false
}


class CommentsViewer extends AbstractViewer {
    constructor() {
        super()
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // init document common data here
        this._showLoadingMessage()
        this._askServerTools();

        this.inited = true
    }

    ///////////////////////////////////////////////// called by Viewer


    _hideSelf() {
        $('#comments_viewer').addClass("hidden")
        if (document.location.search.includes('c')) {
            document.location.search = "" // remove ?c
        }
        super._hideSelf()
    }

    /////////////////////////////////////////////////



    _showSelf() {
        if (!this.inited) this.initialize()
        $('#comments_viewer').removeClass("hidden")

        super._showSelf()
    }

    _showLoadingMessage() {
        // $("#version_viewer_content").html("Loading...")
        // $('#version_viewer #empty').removeClass("hidden")
    }
}
