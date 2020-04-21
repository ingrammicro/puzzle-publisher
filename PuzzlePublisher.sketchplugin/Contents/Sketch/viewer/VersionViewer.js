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


class VersionViewer extends AbstractViewer {
    constructor() {
        super()
        this.screenDiffs = []
        this.mode = 'diff'
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // init document common data here
        this._showLoadingMessage()
        this._askServerTools();

        this.inited = true
    }


    goTo(pageIndex) {
        viewer.goToPage(pageIndex)
    }

    // delta = -1 or +1
    switchMode(delta) {
        const modes = ['diff', 'prev', 'new']
        var posMode = modes.indexOf(this.mode)
        if (undefined == posMode) return

        posMode += delta
        if (posMode < 0) posMode = modes.length - 1
        if (posMode >= modes.length) posMode = 0

        modes.forEach(function (mode, pos) {
            var radio = $("#version_viewer_mode_" + mode)
            radio.prop('checked', pos == posMode)
        }, this)

        this.pageChanged()

    }

    ///////////////////////////////////////////////// called by Viewer


    _hideSelf() {
        this._restoreNewImages()
        $('#version_viewer').addClass("hidden")
        if (document.location.search.includes('v')) {
            document.location.search = "" // remove ?v
        }
        super._hideSelf()
    }

    pageChanged() {

        var disabled = !this.screenDiffs[viewer.currentPage.getHash()]

        $("#version_viewer_mode_diff").prop('disabled', disabled);
        $("#version_viewer_mode_new").prop('disabled', disabled);
        $("#version_viewer_mode_prev").prop('disabled', disabled);
        if (disabled) return

        this._showCurrentPageDiffs()
    }


    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (38 == event.which && event.shiftKey) {   // shift + up
            viewer.increaseVersion()
        } else if (40 == event.which && event.shiftKey) {   // shift + down
            viewer.decreaseVersion()
        } else if (86 == event.which) { // "v" key
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }


    handleKeyDown(jevent) {
        const event = jevent.originalEvent
        var disabled = !this.screenDiffs[viewer.currentPage.getHash()]

        if (86 == event.which) { // "v" key
            this.toggle()
        } else if (!disabled && 37 == event.which && event.shiftKey) {   // left + shift
            this.switchMode(-1)
        } else if (!disabled && 39 == event.which && event.shiftKey) {   // right + shift
            this.switchMode(1)
        } else if (event.shiftKey) {  //shift
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    /////////////////////////////////////////////////

    _restoreNewImages() {
        story.pages.forEach(function (page) {
            if (page.srcImageObjSrc) page.imageObj.attr("src", page.srcImageObjSrc)
        })

    }

    _showScreens(data, showNew) {
        var info = "";
        for (const screen of data['screens_changed']) {
            if (screen['is_new'] != showNew) continue;
            const pageIndex = viewer.getPageIndex(screen['screen_name'], -1)
            const page = pageIndex >= 0 ? story.pages[pageIndex] : undefined

            // We don't need to show external artboards here
            if (page && ("external" == page.type)) continue

            var pageName = page ? page.title : screen['screen_name'];

            if (page && screen['is_diff']) {
                this.screenDiffs[screen['screen_name']] = screen
            }

            info += "<div class='version-screen-div' onclick='viewer.versionViewer.goTo(" + pageIndex + ")'>";
            info += "<div>";
            info += pageName;
            info += "</div><div>";
            info += "<img src='" + screen['image_url'] + "' border='0'/>";
            info += "</div>";
            info += "</div>";
        }
        return info;
    }


    _showCurrentPageDiffs() {
        const data = this.data
        const page = viewer.currentPage
        if (!page || !data) return false

        const screen = this.screenDiffs[page.getHash()]
        if (!screen) return false

        this.mode = $("#version_viewer_mode_diff").prop('checked') ? 'diff' : ($("#version_viewer_mode_prev").prop('checked') ? 'prev' : 'new')
        var newSrc = ''

        // save original image srcs
        if (!page.srcImageObjSrc) page.srcImageObjSrc = page.imageObj.attr("src")

        if ('diff' == this.mode) {
            newSrc = data['journals_path'] + '/' + data['dir'] + "/diffs/" + screen['screen_name'] + (story.hasRetina && viewer.isHighDensityDisplay() ? "@2x" : "") + "." + story.fileType
        } else if ('new' == this.mode) {
            if (page.imageObj.attr("src") != page.srcImageObjSrc) {
                newSrc = page.srcImageObjSrc
            }
        } else {
            newSrc = "../" + data['down_ver'] + "/" + page.srcImageObjSrc
        }


        page.imageObj.attr("src", newSrc)
        return true
    }

    _loadData(data) {
        var info = ""
        this.data = data
        this.screenDiffs = {}

        if (data['screens_total_new']) {
            info += "<p class='head'>Added screens (" + data['screens_total_new'] + "):</p>";
            info += this._showScreens(data, true);
        }
        if (data['screens_total_changed']) {
            info += "<p class='head'>Changed screens (" + data['screens_total_changed'] + ")</p>";
            info += this._showScreens(data, false);
        }
        if (!data['screens_total_new'] && !data['screens_total_changed']) {
            info += "No new or changed screens"
        }

        this.pageChanged()

        $("#version_viewer_content").html(info)
    }

    _askServerTools() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = getVersionInfoRequest;
        xhr.open("GET", story.serverToolsPath + "version_info.php?ver=" + story.docVersion, true);
        xhr.send(null);
    }

    _showSelf() {
        if (!this.inited) this.initialize()
        $('#version_viewer').removeClass("hidden")

        super._showSelf()
    }

    _showLoadingMessage() {
        $("#version_viewer_content").html("Loading...")
        $('#version_viewer #empty').removeClass("hidden")
    }
}
