

class GalleryViewer extends AbstractViewer {
    constructor() {
        super()
        this.isSidebarChild = false
        this.blockMainNavigation = true
        this.enableTopNavigation = true
        this.absZoom = 0.2

        this.searchInputFocused = false
    }

    initialize(force = false) {
        if (!force && this.inited) return

        this.loadPages();
        //load amount of pages to gallery title
        document.getElementById("screensamount").innerHTML = viewer.userStoryPages.length + " screens";

        this.inited = true
    }

    handleKeyDown(jevent) {
        const event = jevent.originalEvent

        if (27 == event.which) { // esc
            this.toggle()
        } else if (!this.searchInputFocused && 71 == event.which) { // g
            // Key "G" deactivates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
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

    _showSelf() {
        if (!this.inited) this.initialize()

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
        return this.loadPagesAbs()
        viewer.userStoryPages.forEach(function (page) {
            this.loadOnePageAbs(page);
        }, this);
    }

    loadPagesAbs() {
        // find left corner of artboard collection
        this.absLeft = null
        this.absTop = null
        this.absRight = null
        this.absBottom = null
        viewer.userStoryPages.forEach(function (page) {
            if (null == this.absLeft || page.x < this.absLeft) this.absLeft = page.x
            if (null == this.absTop || page.y < this.absTop) this.absTop = page.y
            //
            const right = page.x + page.width
            const bottom = page.y + page.height
            if (null == this.absRight || right > this.absRight) this.absRight = right
            if (null == this.absBottom || bottom > this.absBottom) this.absBottom = bottom
        }, this);
        // calculate zoom to fit all artboards
        this.absZoom = (this.absRight - this.absLeft) / viewer.fullWidth
        // show pages using their coordinates and current zoom
        viewer.userStoryPages.forEach(function (page) {
            this.loadOnePageAbs(page);
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
            id: "img_gallery_" + page.index,
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
        var imageURI = page.image

        let style = this._valueToStyle("left", page.x - this.absLeft) + this._valueToStyle("top", page.y - this.absTop)
            + this._valueToStyle("width", page.width) + this._valueToStyle("height", page.height)

        var div = $('<div/>', {
            class: "galleryArtboardAbs",
            style: style,
        });

        div.click(function (e) {
            viewer.galleryViewer.selectPage(parseInt(this.id));
        });
        div.appendTo($('#gallery #grid'));

        var img = $('<img/>', {
            id: "img_gallery_" + page.index,
            class: "gallery-image",
            alt: page.title,
            height: this.absZoom * page.height + "px",
            width: this.absZoom * page.width + "px",
            src: encodeURIComponent(viewer.files) + '/previews/' + encodeURIComponent(imageURI),
        });

        img.appendTo(div);

    }

    _valueToStyle(styleName, v) {
        return styleName + ": " + Number.parseInt(v * this.absZoom) + "px;"
    }

}



//Search page in gallery by page name
function searchScreen() {
    var screens = document.getElementsByClassName("grid-cell");
    var keyword = document.getElementById("searchInput").value.toLowerCase();
    var screensAmount = 0;
    for (var i = 0; i < screens.length; i++) {
        var screenName = screens[i].getElementsByTagName("span")[0].innerHTML.toLowerCase();
        if (screenName.indexOf(keyword) > -1) {
            screens[i].style.display = "";
            screensAmount++;
        } else {
            screens[i].style.display = "none";
        }
    }
    //load amount of pages to gallery title
    document.getElementById("screensamount").innerHTML = screensAmount + " screens";
}
