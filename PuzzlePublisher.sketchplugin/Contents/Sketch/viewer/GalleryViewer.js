

class GalleryViewer extends AbstractViewer {
    constructor() {
        super()
        this.isSidebarChild = false
        this.blockMainNavigation = true

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
    }

    _hideSelf() {
        $('#gallery-modal').addClass('hidden');
        super._hideSelf()
    }



    loadPages() {
        viewer.userStoryPages.forEach(function (page) {
            this.loadOnePage(page);
        }, this);
    }

    selectPage(index) {
        this.hide()
        viewer.goToPage(index)
    }

    loadOnePage(page) {
        var imageURI = story.hasRetina && viewer.isHighDensityDisplay() ? page.image2x : page.image;

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
        div.appendTo($('#grid'));

        var img = $('<img/>', {
            id: "img_gallery_" + page.index,
            class: "gallery-image",
            alt: page.title,
            src: encodeURIComponent(viewer.files) + '/previews/' + encodeURIComponent(imageURI),
        });

        img.appendTo(divMain);
        divMain.appendTo(divWrapper);
        divWrapper.appendTo(div);

        var title = $('<span/>', {
            id: "page-title",
            alt: page.title,
            text: page.title,
        });
        title.appendTo(divMain);
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
