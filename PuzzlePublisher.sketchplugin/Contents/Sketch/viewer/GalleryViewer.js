

class GalleryViewer extends AbstractViewer {
    constructor() {
        super()
        this.isSidebarChild = false
        this.blockMainNavigation = true
        this.enableTopNavigation = true

        const restoredMode = window.localStorage.getItem("galleryIsModeAbs") == "true"
        if (null != restoredMode) this.isModeAbs = restoredMode
        //
        $("#gallery-header-container #controls #galleryShowMap").prop('checked', this.isModeAbs);
        this.absZoom = 0.2
        this.isCustomMapZoom = false
        this.currentFullWidth = null

        this.searchInputFocused = false
    }

    initialize(force = false, skipZoomUpdate = false) {
        if (!force && this.inited) return

        $('#gallery #grid').empty()
        this.loadPages();

        //load amount of pages to gallery title
        document.getElementById("screensamount").innerHTML = viewer.userStoryPages.length + " screens";

        // Adjust map zoom
        const zoomContainter = $("#gallery-header-container #mapControls")
        if (this.isModeAbs) {
            if (!skipZoomUpdate) {
                const zoomControl = $(".mapZoom")
                zoomControl.val(this.absZoom * 100)
            }
            zoomContainter.show();
        } else {
            zoomContainter.hide()
        }

        this.inited = true
    }

    handleKeyDown(jevent) {
        const event = jevent.originalEvent

        if (27 == event.which) { // esc
            this.toggle()
        } else if (!this.searchInputFocused && 71 == event.which) { // g
            // Key "G" deactivates Symbol Viewer
            this.toggle()
        } else if (this.searchInputFocused) {
            return true
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    mapZoomChanged(zoomValue) {
        this.absZoom = zoomValue / 100
        this.isCustomMapZoom = true
        this.initialize(true, true)
    }

    viewerResized() {
        if (!this.isModeAbs) return
        this.initialize(true)
    }

    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (71 == event.which) { // g
            // Key "G" activates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }

    // Calling from UI
    enableMapMode(enabled) {
        window.localStorage.setItem("galleryIsModeAbs", enabled)
        this.isModeAbs = enabled
        this.initialize(true)
    }

    // Calling from UI
    resetMapZoom() {
        this.isCustomMapZoom = false
        this.initialize(true)
    }

    _showSelf() {
        if (!this.inited || this.currentFullWidth != viewer.fullWidth) this.initialize(true)

        $('#gallery-modal').removeClass('hidden');

        $('#searchInput').focusin(function () {
            viewer.galleryViewer.searchInputFocused = true
        })
        $('#searchInput').focusout(function () {
            viewer.galleryViewer.searchInputFocused = false
        })
        $('#searchInput').focus()

        super._showSelf()

        viewer.refresh_url(viewer.currentPage, "", false)
    }

    _hideSelf() {
        $('#gallery-modal').addClass('hidden');
        super._hideSelf()
        viewer.refresh_url(viewer.currentPage, "", false)
    }



    loadPages() {
        if (this.isModeAbs) return this.loadPagesAbs()
        viewer.userStoryPages.forEach(function (page) {
            this.loadOnePage(page);
        }, this);
    }

    loadPagesAbs() {
        // find maximum width of Sketch page with artoards
        let maxGroupWidth = null

        story.groups.forEach(function (group) {
            // find group pages
            const pages = viewer.userStoryPages.filter(s => s.groupID == group.id)
            group.pages = pages // save for below
            if (pages.length == 0) return
            ///
            let left = null, right = null, top = null, bottom = null
            pages.forEach(function (page) {
                if (null == top || page.y < top) top = page.y
                if (null == left || page.x < left) left = page.x
                if (null == right || (page.x + page.width) > right) right = page.x + page.width
                if (null == bottom || (page.y + page.height) > bottom) bottom = page.y + page.height
            }, this);
            const groupWidth = right - left
            if (null == maxGroupWidth || groupWidth > maxGroupWidth) maxGroupWidth = groupWidth
            // // save for below
            group.top = top
            group.bottom = bottom
            group.left = left
            group.right = right
        }, this);

        // Calculate zoom to fit max width
        if (!this.isCustomMapZoom) {
            this.absZoom = viewer.fullWidth / maxGroupWidth
            if (this.absZoom > 0.6) this.absZoom = 0.6
        }
        this.currentFullWidth = viewer.fullWidth

        // show pages using their coordinates and current zoom
        let deltaY = 0
        story.groups.forEach(function (group) {
            if (group.pages.length == 0) return
            ///
            this.absTop = deltaY - group.top
            this.absLeft = group.left
            //// show pages
            group.pages.forEach(function (page) {
                this.loadOnePageAbs(page);
            }, this);
            //
            deltaY += group.bottom + 40
        }, this);
    }

    selectPage(index) {
        this.hide()
        viewer.goToPage(index)
    }

    loadOnePage(page) {
        var imageURI = page.image

        var div = $('<div/>', {
            id: page.index,
            class: "grid-cell",
        });

        var divWrapper = $('<div/>', {
            class: "grid-cell-wrapper"
        });
        var divMain = $('<div/>', {
            class: "grid-cell-main"
        });
        div.click(function (e) {
            viewer.galleryViewer.selectPage(parseInt(this.id));
        });
        div.appendTo($('#gallery #grid'));

        var img = $('<img/>', {
            class: "gallery-image",
            alt: page.title,
            src: encodeURIComponent(viewer.files) + '/previews/' + encodeURIComponent(imageURI),
        });

        img.appendTo(divMain);
        divMain.appendTo(divWrapper);
        divWrapper.appendTo(div);

        var divTitle = $('<div/>', {
            class: "div-page-title"
        });

        var title = $('<span/>', {
            id: "page-title",
            alt: page.title,
            text: page.title,
        });

        title.appendTo(divTitle);
        divTitle.appendTo(divMain);
    }
    loadOnePageAbs(page) {
        let style = this._valueToStyle("left", page.x - this.absLeft) + this._valueToStyle("top", page.y + this.absTop, 80)
            + this._valueToStyle("width", page.width) + this._valueToStyle("height", page.height)

        var div = $('<div/>', {
            id: page.index,
            class: "galleryArtboardAbs",
            style: style,
        });

        div.click(function (e) {
            viewer.galleryViewer.selectPage(parseInt(this.id));
        });
        div.appendTo($('#gallery #grid'));

        const width = Number.parseInt(this.absZoom * page.width)
        // Show large image for large width        
        const previewWidth = 522
        let src = encodeURIComponent(viewer.files)
        if (width < previewWidth) {
            src += '/previews/' + encodeURIComponent(page.image)
        } else {
            src += '/' + encodeURIComponent(story.hasRetina ? page['image2x'] : page.image)
        }

        var img = $('<img/>', {
            class: "gallery-map-image",
            alt: page.title,
            width: width,
            height: Number.parseInt(this.absZoom * page.height) + "px",
            src: src
        });
        img.appendTo(div);
    }

    _valueToStyle(styleName, v, absDelta = 0) {
        return styleName + ": " + Number.parseInt(v * this.absZoom + absDelta) + "px;"
    }

}

//Search page in gallery by page name
function searchScreen() {
    var keyword = $("#searchInput").val().toLowerCase();
    var foundScreenAmount = 0;

    viewer.userStoryPages.forEach(function (page) {
        const title = page.title.toLowerCase()
        const div = $("#gallery #grid #" + page.index)
        if (title.includes(keyword)) {
            div.show()
            foundScreenAmount++
        } else {
            div.hide()
        }
    });

    //load amount of pages to gallery title
    $("#screensamount").html(foundScreenAmount + " screens")
}
