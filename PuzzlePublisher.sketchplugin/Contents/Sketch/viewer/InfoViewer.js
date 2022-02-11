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
        this.currentRec = null
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

    goToVersion(recIndex) {
        const rec = this.data['recs'][recIndex]
        const newURL = rec['url'] + '?' + encodeURIComponent(viewer.currentPage.getHash())
        window.open(newURL, "_self");
    }


    goToScreen(recIndex, screenIndex, pageIndex) {
        this.currentRec = this.data['recs'][recIndex]
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
        $('info_viewer_options').addClass("hidden")
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
        $('#info_viewer_options').removeClass("hidden")

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

    showRecDetails(index, forNew) {
        const rec = this.data['recs'][index]
        if (!rec) return
        ///
        const div = $("#info_viewer .record ." + (forNew ? 'n' : 'u') + "screens#" + index)
        if (!div) return
        div.html("")
        var info = ""
        ///
        if (rec.isVisible) {
            rec.isVisible = false
        } else {
            info += this._showScreens(rec, index, forNew)
            rec.isVisible = true
        }
        div.html(info)
    }
    /////////////////////////////////////////////////

    _restoreNewImages() {
        story.pages.forEach(function (page) {
            if (page.srcImageObjSrc) page.imageObj.attr("src", page.srcImageObjSrc)
        })

    }


    _showScreens(rec, recIndex, showNew) {
        var info = "";
        for (const [screenIndex, screen] of rec['screens_changed'].entries()) {
            if (screen['is_new'] != showNew) continue;
            const pageIndex = viewer.getPageIndex(screen['screen_name'], -1)
            const page = pageIndex >= 0 ? story.pages[pageIndex] : undefined

            // We don't need to show external artboards here
            if (page && ("external" == page.type)) continue

            var pageName = page ? page.title : screen['screen_name'];

            if (page && screen['is_diff']) {
                this.screenDiffs[screen['screen_name']] = screen
            }

            info += "<div class='version-screen-div' onclick='viewer.infoViewer.goToScreen(" + recIndex + "," + screenIndex + "," + pageIndex + ")'>";
            info += "<div>";
            info += pageName;
            info += "</div><div>";
            if (showNew)
                info += "<img src='" + screen['image_url'] + "' border='0' width='360px'/>";
            else
                info += "<img src='" + rec['journals_path'] + '/' + rec['dir'] + "/diffs/" + screen['screen_name'] + "." + story.fileType + "' border='0' width='360px'/>";
            info += "</div>";
            info += "</div>";
        }
        return info;
    }


    _showCurrentPageDiffs() {
        const data = this.currentRec
        const page = viewer.currentPage
        if (!page || !data) return false

        const screen = this.screenDiffs[page.getHash()]
        if (!screen) return false

        this.mode = $("#info_viewer_mode_diff").prop('checked') ? 'diff' : ($("#info_viewer_mode_prev").prop('checked') ? 'prev' : 'new')
        var newSrc = ''

        // save original image srcs
        if (!page.srcImageObjSrc) page.srcImageObjSrc = page.imageObj.attr("src")

        if ('diff' == this.mode) {
            newSrc = data['journals_path'] + '/' + data['dir'] + "/diffs/" + screen['screen_name'] + "." + story.fileType
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
            info += `<div class="head" style="font-weight:bold;"><div class="tooltip">Owner: ${story.ownerName}<span class="tooltiptext">${story.ownerEmail}</span></div></div>`
        } else {
            info += "Unknown"
        }
        info += `<div id = "info_viewer_content_dynamic"/>`

        $("#info_viewer_content").html(info)
    }

    _loadData(data) {
        var info = ""

        info += `<div id="title" style="font-weight:bold;">Changes</div>`

        data['recs'].forEach(function (rec, index) {
            var authorHTML = undefined != rec['email'] ? `<div class="tooltip">by ${rec['author']}<span class="tooltiptext">${rec['email']}</span></div>` : rec['author']
            info += `
            <div class="record">
                <div class="ver"><a href="#" onclick="viewer.infoViewer.goToVersion(${index})">#${rec['ver']}</a> ${new Date(rec['time'] * 1000).toLocaleDateString()} ${authorHTML}</div>
                <div class="message">${rec['message'].replaceAll('--NOTELE', '')}</div>
                <div class="info">
            `
            if (rec['screens_total_new']) {
                info += `Added: <a href="#" onclick="viewer.infoViewer.showRecDetails(${index},true)">${rec['screens_total_new']} screen(s)</a>`
                info += `<div class="nscreens" id="${index}"/>`
            }
            if (rec['screens_total_changed']) {
                info += `Updated: <a href="#" onclick="viewer.infoViewer.showRecDetails(${index},false)">${rec['screens_total_changed']} screen(s)</a>`
                info += `<div class="uscreens" id="${index}"/>`
            }
            if (!rec['screens_total_new'] && !rec['screens_total_changed']) {
                info += "No visual changes"
            }
            info += `</div></div>`
        }, this)

        this.data = data
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
