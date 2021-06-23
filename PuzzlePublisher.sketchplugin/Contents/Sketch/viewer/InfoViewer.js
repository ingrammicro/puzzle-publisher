function getVersionInfoRequest() {
    var resp = this
    if (resp.readyState == resp.DONE) {
        if (resp.status == 200 && resp.responseText != null) {
            const data = JSON.parse(resp.responseText)
            if (undefined != data['recs']) {
                viewer.infoViewer._loadData(data);
                return true
            }
        }
        showError("Can't get information about the versions.")
    }
    return false
}


class infoViewer extends AbstractViewer {
    constructor() {
        super()
        this.screenDiffs = []
        this.mode = 'diff'
        this.published = story.docVersion != 'V_V_V'
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // init document common data here        
        this._showStatic()
        if (this.published) {
            this._showLoadingMessage()
            this._askServerTools();
        }

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
            var radio = $("#info_viewer_mode_" + mode)
            radio.prop('checked', pos == posMode)
        }, this)

        this.pageChanged()

    }

    ///////////////////////////////////////////////// called by Viewer


    _hideSelf() {
        this._restoreNewImages()
        $('#info_viewer').addClass("hidden")
        if (document.location.search.includes('v')) {
            document.location.search = "" // remove ?v
        }
        super._hideSelf()
    }

    pageChanged() {

        var disabled = !this.screenDiffs[viewer.currentPage.getHash()]

        $("#info_viewer_mode_diff").prop('disabled', disabled);
        $("#info_viewer_mode_new").prop('disabled', disabled);
        $("#info_viewer_mode_prev").prop('disabled', disabled);
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

            info += "<div class='version-screen-div' onclick='viewer.infoViewer.goTo(" + pageIndex + ")'>";
            info += "<div>";
            info += pageName;
            info += "</div><div>";
            info += "<img src='" + screen['image_url'] + "' border='0' width='360px'/>";
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

        this.mode = $("#info_viewer_mode_diff").prop('checked') ? 'diff' : ($("#info_viewer_mode_prev").prop('checked') ? 'prev' : 'new')
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

    _showStatic() {
        var info = ""

        if (story.ownerEmail != '') {
            info += `<div class="tooltip">Owner: ${story.ownerName}<span class="tooltiptext">${story.ownerEmail}</span></div>`
        } else {
            info += "Unknown"
        }
        info += `<div id = "info_viewer_content_dynamic"/>`

        $("#info_viewer_content").html(info)
    }

    _loadData(data) {
        var info = ""
        this.data = data

        info += `<div id="title" style="font-weight:bold;">Versions</div>`

        data['recs'].forEach(function (rec) {
            info += `<div>#${rec['ver']} ${rec['time']}</div>
            <div>${rec['author']}</div>
            `
        }, this)

        $("#info_viewer_content_dynamic").html(info)
    }

    _loadData2(data) {
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

        $("#info_viewer_content_dynamic").html(info)
    }



    _askServerTools() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", story.serverToolsPath + "version_info.php?ver=" + story.docVersion, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = getVersionInfoRequest;
        xhr.send(null);
    }

    _showSelf() {
        if (!this.inited) this.initialize()
        $('#info_viewer').removeClass("hidden")

        super._showSelf()
    }

    _showLoadingMessage() {
        $("#info_viewer_content_dynamic").html("Loading...")
    }
}
