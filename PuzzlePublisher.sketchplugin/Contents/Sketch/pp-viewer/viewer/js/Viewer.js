// =============================== PRELOAD IMAGES =========================
var pagerLoadingTotal = 0

function getQuery(uri, q) {
    return (uri.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
}

function showError(error) {
    alert(error)
}

function showMessage(message) {
    alert(message)
}

function checkFolderInfoRequest(resp) {
    if (resp.readyState == resp.DONE) {
        if (resp.status == 200 && resp.responseText != null) {
            const data = JSON.parse(resp.responseText)
            if (undefined != data['project_url'] && '' != data['project_url']) return data
        }
        showError("Can't get information about the versions.")
    }
    return undefined
}

function handleDecreaseVersion() {
    var data = checkFolderInfoRequest(this)
    if (undefined == data) return
    if ('' == data.link_down) return showMessage('This is the oldest version.')
    window.open(data.link_down + '?' + encodeURIComponent(viewer.currentPage.getHash()), "_self");
}

function handleIncreaseVersion() {
    var data = checkFolderInfoRequest(this)
    if (undefined == data) return
    let link = data.link_up
    if ('' == link) {
        if (!window.confirm('This is the newest version. Go to live version?')) return
        link = data.link_live
    }
    window.open(link + '?' + encodeURIComponent(viewer.currentPage.getHash()), "_self");
}

function doTransNext() {
    // get oldest transition
    const trans = viewer.transQueue[0]
    // if it still active then run it
    if (trans.active) {
        viewer.next()
        console.log("RUN transition")
    } else {
        console.log("skip transition")
    }

    // remove this transtion from stack
    viewer.transQueue.shift()
}

$.fn.preload = function (callback) {
    var length = this.length;
    var iterator = 0;

    return this.each(function () {
        var self = this;
        var tmp = new Image();

        if (callback) tmp.onload = function () {
            callback.call(self, 100 * ++iterator / length, iterator === length);
            pagerMarkImageAsLoaded()
        };
        tmp.src = this.src;
    });
};

function pagerMarkImageAsLoaded() {
    console.log(pagerLoadingTotal);
    if (--pagerLoadingTotal == 0) {
        $("#nav #loading").addClass("hidden")
    }
}

async function preloadAllPageImages() {
    $("#nav #loading").removeClass("hidden")
    pagerLoadingTotal = story.totalImages
    var pages = story.pages;
    for (var page of story.pages) {
        if (page.imageObj == undefined) {
            page.loadImages()
            page.imageDiv.addClass("hidden")
        }
    }
}

function reloadAllPageImages() {
    for (var page of story.pages) {
        page.imageObj.parent().remove();
        page.imageObj = undefined
        for (var p of page.fixedPanels) {
            p.imageObj.parent().remove();
            p.imageObj = undefined
        }
    }
    preloadAllPageImages()
}

function doBlinkHotspots() {
    viewer.toggleLinks()
}


// str: .transit .slideInDown"
function splitStylesStr(str) {
    return str.split(" ").map(s => s.replace(".", ""))
}

// ============================ VIEWER ====================================

class Viewer {
    constructor(story, files) {
        this.highlightLinks = story.highlightLinks
        this.showLayout = false
        this.showUI = true
        this.isFullScreen = false
        this.isEmbed = false
        this.figma = false

        this.searchText = ""

        this.fullBaseURL = ""
        this.fullCurrentPageURL = ""

        this.prevPage = undefined
        this.currentPage = undefined
        this.lastRegularPage = undefined

        this.currentMarginLeft = undefined
        this.currentMarginTop = undefined

        this.backStack = []
        this.urlLastIndex = -1
        this.urlLocked = false
        this.stateChangeIgnore = false
        this.files = files
        this.userStoryPages = []
        this.visStoryPages = []
        this.zoomEnabled = story.zoomEnabled
        this.menuVisible = false

        this.sidebarVisible = false
        this.child = null // some instance of Viewer
        this.allChilds = [] // list of all inited instances of Viewer

        this.symbolViewer = null
        this.infoViewer = null
        this.commentsViewer = null
        this.presenterViewer = null
        this.expViewer = null

        this.defSidebarWidth = 400

        this.transQueue = []
    }

    initialize() {
        this.initParseGetParams()
        this.buildUserStory();
        this.initializeHighDensitySupport();
        this.initAnimations()

        /// Init UI            
        $("#menu #zoom").prop('checked', this.zoomEnabled);

        /// Init Viewers
        this.galleryViewer = new GalleryViewer()

        if (story.layersExist) {
            this.symbolViewer = new SymbolViewer()
            if (story.experimentalExisting) this.expViewer = new ExpViewer()
        }
        this.infoViewer = new infoViewer()
        this.presenterViewer = new PresenterViewer()

        if (story.commentsURL != 'V_V_C' && story.commentsURL != "") {
            this.commentsViewer = new CommentsViewer()
            $("#nav #pageComments").removeClass("hidden")
        }

        if (story.experimentalExisting) {
            $("#nav #experimental").removeClass("hidden")
        }

    }

    initAnimations() {
        if (story.layersExist) {
            // TODO
        }
        // transform ".transit .slideInDown" strings into class name arrays
        TRANS_ANIMATIONS.forEach(function (t, index) {
            if (0 == index) return
            t.in_classes = splitStylesStr(t.in_str_classes)
            t.out_classes = splitStylesStr(t.out_str_classes)
        }, this)
    }

    initializeLast() {

        $("body").keydown(function (event) {
            viewer.handleKeyDown(event)
        })
        window.addEventListener('mousemove', function (e) {
            viewer.onMouseMove(e.pageX, e.pageY)
        });
        jQuery(window).resize(function () { viewer.zoomContent() });

        // Activate galleryViewer
        const gParam = this.urlParams.get('g')
        const av = this.urlParams.get('av')
        if (gParam != null && this.galleryViewer) {
            this.galleryViewer.handleURLParam(gParam)
            this.galleryViewer.show()
        } else if (this.urlParams.get('v') != null && this.infoViewer) {
            // Activate Changes Inspector
            this.infoViewer.toggle()
        } else if (this.urlParams.get('c') != null && this.commentsViewer) {
            // Activate Comment Viewer
            this.commentsViewer.toggle()
        } else if (av != null && av === "exp" && this.expViewer) {
            const widgetName = this.urlParams.get('expn')
            if (widgetName !== null) this.expViewer.highlightWidget(decodeURIComponent(widgetName))
            // Activate Experimental Viewer widget
            this.expViewer.toggle()
        }
    }

    initParseGetParams() {
        const loc = document.location
        this.fullBaseURL = loc.protocol + "//" + loc.hostname + loc.pathname
        this.urlParams = new URLSearchParams(loc.search.substring(1));
        this.urlSearch = loc.search

        if (this.urlParams.get('e') != null) {
            this.isEmbed = true
            // hide image preload indicator
            $('#nav loading').hide()
            // hide Navigation
            $('.navCenter').hide()
            $('.navPreviewNext').hide()
            $('#btnMenu').hide()
            $('#btnOpenNew').show()
        }
    }
    initializeHighDensitySupport() {
        if (window.matchMedia) {
            this.hdMediaQuery = window
                .matchMedia("only screen and (min--moz-device-pixel-ratio: 1.1), only screen and (-o-min-device-pixel-ratio: 2.2/2), only screen and (-webkit-min-device-pixel-ratio: 1.1), only screen and (min-device-pixel-ratio: 1.1), only screen and (min-resolution: 1.1dppx)");
            var v = this;
            this.hdMediaQuery.addListener(function (e) {
                v.refresh();
            });
        }
    }
    isHighDensityDisplay() {
        return (this.hdMediaQuery && this.hdMediaQuery.matches || (window.devicePixelRatio && window.devicePixelRatio > 1));
    }
    buildUserStory() {
        //
        let opages = []
        story.pages.forEach(function (page) {
            opages.push($.extend(new ViewerPage(), page))
        })
        story.pages = opages
        //
        this.userStoryPages = []
        this.visStoryPages = []
        for (var page of story.pages) {
            if ('regular' == page.type || 'modal' == page.type) {
                page.userIndex = this.userStoryPages.length
                this.userStoryPages.push(page)
            } else {
                page.userIndex = -1
            }
            //
            if ('regular' == page.type || 'modal' == page.type || 'overlay' == page.type) {
                page.visIndex = this.visStoryPages.length
                this.visStoryPages.push(page)
            } else {
                page.visIndex = -1
            }
        }
    }

    handleKeyDown(jevent) {
        const v = viewer
        const event = jevent.originalEvent

        const allowNavigation = !this.child || !this.child.blockMainNavigation
        const enableTopNavigation = !this.child || this.child.enableTopNavigation

        // allow all childs to handle global keys
        if (!this.child) {
            for (const child of this.allChilds) {
                if (child.handleKeyDownWhileInactive(jevent)) return true
            }
        }

        // allow currently active childs to handle global keys
        if (this.child && this.child.handleKeyDown(jevent)) return true

        if (allowNavigation && 91 == event.which) { // cmd
            if (this.highlightLinks) v.toggleLinks(false) // hide hightlights to allow user to make a screenshot on macOS
        }

        if (allowNavigation && (13 == event.which || 39 == event.which)) { // enter OR right
            v.next()
        } else if (allowNavigation && (8 == event.which || 37 == event.which)) { // backspace OR left
            v.previous()
        } else if (allowNavigation && story.layersExist && event.metaKey && (70 == event.which) && (!this.child || !this.child.customTextSearchPrevented())) { // Cmd+F
            this.showTextSearch()
        } else if (allowNavigation && story.layersExist && event.metaKey && (71 == event.which) && (!this.child || !this.child.customTextSearchPrevented())) { // Cmd+G -> Next search
            this.currentPage.findTextNext()
        } else if (allowNavigation && (16 == event.which)) { // shift
            if (!jevent.metaKey) {  // no cmd to allow user to make a screenshot on macOS
                v.toggleLinks()
            }
        } else if (event.metaKey || event.altKey || event.ctrlKey) { // skip any modificator active to allow a browser to handle its own shortkeys
            return false
        } else if (allowNavigation && 90 == event.which) { // z
            v.toggleZoom()
        } else if (allowNavigation && 69 == event.which) { // e
            v.share()
        } else if (73 == event.which) { // i
            v.openFulImage()
        } else if (allowNavigation && 76 == event.which) { // l
            v.toogleLayout();
        } else if (allowNavigation && 78 == event.which) { // n
            v.toogleUI();
        } else if (70 == event.which) { // f
            v.toogleFullScreen()
        } else if (enableTopNavigation && 83 == event.which) { // s
            var first = null != story.startPageIndex ? story.pages[story.startPageIndex] : v.getFirstUserPage()
            if (first && (first.index != v.currentPage.index || this.child)) {
                this.hideChild()
                v.goToPage(first.index)
            }
        } else if (allowNavigation && 27 == event.which) { // esc
            v.onKeyEscape()
        } else {
            return false
        }
        jevent.preventDefault()
        return true
    }

    showTextSearch() {
        const search = prompt("Type text to find:", this.searchText)
        if (null != search) {
            this.searchText = search
            if (this.currentPage.findText(this.searchText)) {
            }
        }
    }

    blinkHotspots() {
        if (this.symbolViewer && this.symbolViewer.visible) return
        this.toggleLinks()
        setTimeout(doBlinkHotspots, 500)
    }

    setMouseMoveHandler(obj) {
        this.mouseMoveHandler = obj
    }

    onMouseMove(x, y) {
        if (this.mouseMoveHandler && this.mouseMoveHandler.onMouseMove(x, y)) return
        if (this.currentPage) this.currentPage.onMouseMove(x, y)
    }

    onContentClick() {
        // Do we need to close a menu?
        if (this.menuVisible) this.hideMenu()

        // allow currently active child to handle click
        if (this.child && this.child.onContentClick()) return true

        if (this.linksDisabled) return false
        if (this.onKeyEscape()) return
        this.blinkHotspots()
    }
    onModalClick() {
        this.blinkHotspots()
    }


    showMenu() {
        addRemoveClass('class', 'menu', 'active')
        this.menuVisible = true
        return true
    }
    hideMenu() {
        addRemoveClass('class', 'menu', 'active')
        this.menuVisible = false
        return true
    }

    _setupFolderinfoRequest(func) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", story.serverToolsPath + "folder_info.php", true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = func;
        xhr.send(null);
    }

    decreaseVersion() {
        this._setupFolderinfoRequest(handleDecreaseVersion)
    }

    increaseVersion() {
        this._setupFolderinfoRequest(handleIncreaseVersion)
    }

    showChild(child) {
        // Hide currently visible child
        if (this.child) {
            this.hideChild(this.child)
        }

        // Show new child
        this.child = child;
        if (child.isSidebarChild) {
            this._showSidebar()
        }
        child._showSelf()
    }

    _showSidebar() {
        this.sidebarVisible = true
        $('#sidebar').removeClass("hidden")
        viewer.zoomContent()
    }

    _hideSidebar() {
        this.sidebarVisible = false
        $('#sidebar').addClass("hidden")
        this.zoomContent()
    }

    hideChild() {
        if (!this.child) return;
        if (this.child.isSidebarChild) {
            this._hideSidebar()
        }
        this.child._hideSelf()
        this.child = null;

    }

    share() {
        var page = this.currentPage
        let url = this._getPageFullURL()
        url += '&e=1'

        var iframe = '<iframe src="' + url + '" style="border: none;" noborder="0"'
        iframe += ' width="' + (story.iFrameSizeWidth ? story.iFrameSizeWidth : page.width) + '"'
        iframe += ' height="' + (story.iFrameSizeHeight ? story.iFrameSizeHeight : page.height) + '"'
        iframe += ' scrolling="auto" seamless id="iFrame1"></iframe>'

        iframe += '\n\n'

        var ihref = url.substring(0, url.lastIndexOf("/"))

        ihref = ihref + "/images/" + page['image2x']
        iframe += "<a target='_blank' href='" + url + "'>" + "<img border='0' "
        iframe += ' width="' + (story.iFrameSizeWidth ? story.iFrameSizeWidth : page.width) + '"'
        //iframe += ' height="'+(story.iFrameSizeHeight?story.iFrameSizeHeight:page.height) + '"'
        iframe += "src='" + ihref + "'"
        iframe += "/></a>"

        alert(iframe)
    }


    openFulImage() {
        let page = this.currentPage
        let url = this._getPageFullURL(page)
        url = url.substring(0, url.lastIndexOf("/")) + "/images/full/" + page['image']

        window.open(url, "_blank")
    }



    toggleZoom(newState = undefined, updateToogler = true) {
        this.zoomEnabled = newState !== undefined ? newState : !this.zoomEnabled
        if (updateToogler) $("#menu #zoom").prop('checked', this.zoomEnabled)
        this.zoomContent()
    }

    openNewWindow() {
        let url = this.fullCurrentPageURL
        // ok, now open it in the new browse window
        window.open(url, "_blank")
    }

    zoomContent() {
        var page = this.lastRegularPage
        if (undefined == page) return


        if (undefined == this.marker) {
            this.marker = $('#marker')
        }
        var marker = this.marker

        var content = $('#content')
        //var contentShadow = $('#content-shadow')
        var contentModal = $('#content-modal')
        var elems = [content, contentModal] //,contentShadow

        var fullWidth = marker.innerWidth()
        var availableWidth = fullWidth
        var zoom = ""
        var scale = ""

        // check sidebar
        var sidebarWidth = 0
        if (this.sidebarVisible) {
            var sidebar = $("#sidebar")

            sidebarWidth = this.defSidebarWidth

            /* commented because it works in bad way with small artboards and large screen
            sidebarWidth = Math.round((fullWidth - page.width) / 2)
            if (sidebarWidth < defSidebarWidth) {
                sidebarWidth = defSidebarWidth
                availableWidth = fullWidth - sidebarWidth
            }*/
            if (((fullWidth - page.width) / 2) < sidebarWidth) {
                availableWidth = fullWidth - sidebarWidth
            }

            sidebar.css("margin-left", (fullWidth - sidebarWidth) + "px")
            sidebar.css("margin-top", (0) + "px")
            sidebar.css("width", sidebarWidth + "px")
            sidebar.css("height", "100%")
        }


        if (this.zoomEnabled && ((availableWidth < page.width) || screen.width <= 800)) {
            zoom = availableWidth / page.width
            scale = "scale(" + zoom + ")"
        }

        var newZoom = zoom != '' ? (zoom + 0) : 1

        if (undefined == this.currentZoom || this.currentZoom != newZoom) {
            for (var el of elems) {
                el.css("zoom", zoom)
                el.css("-moz-transform", scale)
            }
            content.css("-moz-transform-origin", "left top")
            contentModal.css("-moz-transform-origin", "center top")

        }

        this.currentZoom = newZoom
        this.fullWidth = fullWidth

        // Calculate margins
        this.currentMarginLeft = Math.round(availableWidth / 2) - Math.round(page.width / 2 * this.currentZoom)
        this.currentMarginTop = 0

        if (this.currentMarginLeft < 0) this.currentMarginLeft = 0

        // Set content to new left positions
        content.css("margin-left", this.currentMarginLeft + "px")
        content.css("margin-top", this.currentMarginTop + "px")
        this.currentPage.updatePosition()

        //
        if (this.child) {
            this.child.viewerResized()
        }
    }

    getPageHashes() {
        if (this.pageHashes == null) {
            var hashes = {};
            for (var page of story.pages) {
                hashes[page.getHash()] = page.index;
            }
            this.pageHashes = hashes;
        }
        return this.pageHashes;
    }

    getModalFirstParentPageIndex(modalIndex) {
        var foundPageIndex = null
        // scan all regular pages
        story.pages.filter(page => "regular" == page.type).some(function (page) {
            const foundLinks = page.links.filter(link => link.page != null && link.page == modalIndex)
            if (foundLinks.length != 0) {
                // return the page index which has link to modal
                foundPageIndex = page.index
                return true
            }
            // save a first regular page as a "found" for case if we will not
            // find any page with a link to a specified modal
            if (null == foundPageIndex) foundPageIndex = page.index
            return false
        }, this)

        // ok, we found some regular page which has a link to specified modal ( or it was a fist regular page)
        return foundPageIndex
    }

    getPageIndex(page, defIndex = 0) {
        var index;

        if (typeof page === "number") {
            index = page;
        } else if (page === "") {
            index = defIndex;
        } else {
            index = this.getPageHashes()[page];
            if (index == undefined) {
                index = defIndex;
            }
        }
        return index;
    }

    goBack() {
        if (this.backStack.length > 0) {
            this.goTo(this.backStack[this.backStack.length - 1], true, undefined, false);
            this.backStack.pop();
        } else if (this.currentPage.isModal && this.lastRegularPage) {
            this.goTo(this.lastRegularPage.index, true, undefined, false);
        } else {
            window.history.back();
        }
    }
    closeModal() {
        return this.goBack()
    }
    goToPage(page, searchText) {
        this.clear_context();
        this.goTo(page);
        //
        if (undefined != searchText) {
            this.searchText = searchText
            this.currentPage.findText(this.searchText)
        }
    }

    goTo(page, refreshURL = true, link = undefined, incBackStack = true) {

        var index = this.getPageIndex(page);
        var newPage = story.pages[index];

        // Need to build a context for overlay
        if (newPage.type === "overlay") {
            if (newPage.showOverlayOverParent()) return
        }

        // We don't need any waiting page transitions anymore
        this._resetTransQueue()

        //if(this.symbolViewer) this.symbolViewer.hide()
        var currentPage = this.currentPage

        if (incBackStack && currentPage && !currentPage.isModal) {
            this.backStack.push(currentPage.index);
        }

        var oldcurrentPageModal = currentPage && currentPage.isModal

        if (index < 0 || (currentPage && index == currentPage.index) || index >= story.pages.length) return;


        if (newPage.type === "modal") {
            // hide parent page links hightlighting
            this._updateLinksState(false, $('#content'))

            // no any page visible now, need to find something
            if (undefined == currentPage) {
                var parentIndex = this.getModalFirstParentPageIndex(index);
                this.goTo(parentIndex, false);
                this.zoomContent()
            }

            // redraw modal links hightlighting
            this._updateLinksState()
        } else {
            if (oldcurrentPageModal) {
                // hide modal page links hightlighting
                this._updateLinksState(false, $('#content-modal'))
                this._updateLinksState(undefined, $('#content'))
            }
        }
        this.prevPage = currentPage
        var prevRegularPage = this.lastRegularPage

        newPage.show()

        this.refresh_adjust_content_layer(newPage);
        this.refresh_hide_last_image(newPage)
        this.refresh_switch_modal_layer(newPage);
        if (refreshURL) {
            this.refresh_url(newPage)
        } else {
            this._calcCurrentPageURL(newPage)
        }
        this.refresh_update_navbar(newPage);

        this.currentPage = newPage;
        if (!newPage.isModal) {
            this.lastRegularPage = newPage
        }

        // zoom content if the new page dimensions differ from the previous
        if (!newPage.isModal) {
            if (!prevRegularPage || newPage.width != prevRegularPage.width || newPage.height != prevRegularPage.height) {
                this.zoomContent()
            }
        }


        if (newPage.transNextMsecs != undefined) {
            this._setupTransNext(newPage.transNextMsecs)
        }

        if (!newPage.disableAutoScroll && (!link || !link.disableAutoScroll)) {
            window.scrollTo(0, 0)
        }

        if (this.child) this.child.pageChanged()
        this.allChilds.filter(c => c.alwaysHandlePageChanged).forEach(function (c) {
            c.pageChanged()
        })
    }

    _setupTransNext(msecs) {
        // deactivate all waiting transitions
        for (var trans of this.transQueue) {
            trans.active = false
        }
        // place new active transition over the top of stack
        this.transQueue.push({
            page: this.currentPage,
            active: true
        })
        // set timer in milisecs
        setTimeout(doTransNext, msecs)
    }
    // Deactivate all waiting transitions
    _resetTransQueue() {
        for (var trans of this.transQueue) {
            trans.active = false
        }
    }
    refresh_update_navbar(page) {
        var VERSION_INJECT = story.docVersion != 'V_V_V' ? (" (v" + story.docVersion + ")") : "";

        var prevPage = this.getPreviousUserPage(page)
        var nextPage = this.getNextUserPage(page)

        $('#nav .title').html((page.userIndex + 1) + '/' + this.userStoryPages.length + ' - ' + page.title + VERSION_INJECT);
        $('#nav-left-prev').toggleClass('disabled', !prevPage)
        $('#nav-left-next').toggleClass('disabled', !nextPage)

        if (prevPage) {
            $('#nav-left-prev a').attr('title', prevPage.title);
        } else {
            $('#nav-left-prev a').removeAttr('title');
        }

        if (nextPage) {
            $('#nav-left-next a').attr('title', nextPage.title);
        } else {
            $('#nav-left-next a').removeAttr('title');
        }

        $('#nav-right-hints').toggleClass('disabled', page.annotations == undefined);

        this.refresh_update_links_toggler(page);
    }
    refresh_update_links_toggler(page) {
        $("#menu #links").prop('checked', this.highlightLinks);
    }
    refresh_hide_last_image(page) {
        var content = $('#content');
        var contentModal = $('#content-modal');
        var isModal = page.isModal

        // hide last regular page to show a new regular after modal
        if (!isModal && this.lastRegularPage && this.lastRegularPage.index != page.index) {
            var lastPageImg = $('#img_' + this.lastRegularPage.index);
            if (lastPageImg.length) {
                this.lastRegularPage.hide()
            }
        }

        // hide last modal
        var prevPageWasModal = this.prevPage != null && this.prevPage.type === "modal"
        if (prevPageWasModal) {
            var prevImg = $('#img_' + this.prevPage.index);
            if (prevImg.length) {
                this.prevPage.hide()
                //pagerHideImg(prevImg)
            }
        }
    }
    refresh_adjust_content_layer(page) {
        if (page.isModal) return;

        var contentShadow = $('#content-shadow');
        var contentModal = $('#content-modal');
        var content = $('#content');

        var prevPageWasModal = this.prevPage && this.prevPage.isModal
        if (prevPageWasModal) {
            contentShadow.addClass('hidden');
            contentModal.addClass('hidden');
        }
    }

    refresh_switch_modal_layer(page) {
        if (!page.isModal) return;

        var showShadow = page.showShadow == 1;
        var contentModal = $('#content-modal');
        var contentShadow = $('#content-shadow');

        if (showShadow) {
            contentShadow.removeClass('no-shadow');
            contentShadow.addClass('shadow');
            contentShadow.removeClass('hidden');
        } else {
            contentModal.addClass('hidden');
        }
        contentModal.removeClass('hidden');
    }

    _getSearchPath(page = null, extURL = null) {
        if (!page) page = this.currentPage
        let search = '?' + encodeURIComponent(page.getHash())
        if (extURL != null && extURL != "") search += "&" + extURL
        return search
    }

    _getPageFullURL(page = null, extURL = null) {
        if (!page) page = this.currentPage
        return this.fullBaseURL + this._getSearchPath(page, extURL)
    }

    _calcCurrentPageURL(page = null, extURL = null) {
        if (!page) page = this.currentPage
        this.urlLastIndex = page.index
        $(document).attr('title', story.title + ': ' + page.title)

        let newPath = this._getPageFullURL(page, extURL)
        this.fullCurrentPageURL = newPath
    }

    refresh_url(page, extURL = "", pushHistory = true) {
        if (this.urlLocked) return

        this._calcCurrentPageURL(page, extURL)
        let newPath = this.fullCurrentPageURL
        this.fullCurrentPageURL = newPath

        if (this.isEmbed) {
            newPath += "&e=1"
        }
        if (this.galleryViewer && this.galleryViewer.isVisible()) {
            newPath += "&g=" + (this.galleryViewer.isMapMode ? "m" : "g")
        }
        if (this.commentsViewer && this.commentsViewer.isVisible()) {
            newPath += "&c=1"
        }

        if (pushHistory) {
            window.history.pushState(newPath, page.title, newPath);
        } else {
            window.history.replaceState({}, page.title, newPath);
        }
    }

    _parseLocationSearch() {
        //if (document.location.hash != null && document.location.hash != "")
        //  return this._parseLocationHash()

        var result = {
            page_name: "",
            reset_url: false,
            overlayLinkIndex: undefined,
            redirectOverlayLinkIndex: undefined,
        }
        this.urlParams.forEach(function (value, key) {
            if ("" == value) result.page_name = key
        }, this);

        if (null == result.page_name || "" == result.page_name || this.urlParams.get(result.page_name) != "") {
            result.page_name = ""
            result.reset_url = true
        } else {
            result.overlayLinkIndex = this.urlParams.get("o")
        }
        return result
    }

    handleNewLocation(initial) {
        var locInfo = this._parseLocationSearch()
        var pageIndex = locInfo.page_name != null ? this.getPageIndex(locInfo.page_name, null) : null
        if (null == pageIndex) {
            if (locInfo.page_name != "") alert("The requested page is not found. You will be redirected to the default page.")
            // get the default page
            pageIndex = story.startPageIndex
            locInfo.reset_url = true
        }

        if (!initial && this.urlLastIndex == pageIndex) {
            return
        }

        var page = story.pages[pageIndex];

        // check if this redirect overlay
        let overlayRedirectInfo = null
        if (undefined != page.overlayRedirectTargetPage) {
            overlayRedirectInfo = page._getSrcPageAndLink()
            if (overlayRedirectInfo) {
                pageIndex = overlayRedirectInfo.page.index
                page = overlayRedirectInfo.page
            }

        }

        if (initial)
            page.isDefault = true
        else
            this.clear_context();

        // check if this page overlay
        // check if this redirect overlay
        this.goTo(pageIndex, locInfo.reset_url);

        if (locInfo.overlayLinkIndex != null) {
            page.showOverlayByLinkIndex(locInfo.overlayLinkIndex)
        }

        if (!initial) this.urlLastIndex = pageIndex

        // Open redirect overlay over the overlay source page
        if (overlayRedirectInfo) {
            overlayRedirectInfo.link.a.click()
        }
    }

    clear_context_hide_all_images() {
        var page = this.currentPage;
        var content = $('#content');
        var contentModal = $('#content-modal');
        var contentShadow = $('#content-shadow');
        var isModal = page && page.type === "modal";

        contentShadow.addClass('hidden');
        contentModal.addClass('hidden');

        // hide last regular page
        if (this.lastRegularPage) {
            var lastPageImg = $('#img_' + this.lastRegularPage.index);
            if (lastPageImg.length) {
                this.lastRegularPage.hide()
            }
        }

        // hide current modal
        if (isModal) {
            var modalImg = $('#img_' + this.currentPage.index);
            if (modalImg.length) {
                this.currentPage.hide()
            }
        }
    }

    clear_context() {
        this.clear_context_hide_all_images()

        this.prevPage = undefined
        this.currentPage = undefined
        this.lastRegularPage = undefined

        this.backStack = []
    }

    refresh() {
        reloadAllPageImages()
        this.currentPage.show()
    }

    onKeyEscape() {
        // Close menu
        if (this.menuVisible) return this.hideMenu()


        const page = this.currentPage
        // If the current page has search visible then hide it
        if (undefined != page.actualSearchText) {
            page.stopTextSearch()
            return true
        }
        // If the current page has some overlay open then close it
        if (page.hideCurrentOverlays()) {
            return true
        }
        // If the current page is modal then close it and go to the last non-modal page
        if (this.currentPage.isModal) {
            viewer.closeModal()
            return true
        }
        return false
    }
    next() {
        var page = this.getNextUserPage(this.currentPage)
        if (!page) return
        this.goToPage(page.index);
    }

    previous() {
        // Get previous page
        var page = this.getPreviousUserPage(this.currentPage)
        // Go from the first to the latest page
        if(!page) page =  this.userStoryPages[ this.userStoryPages.length-1]
        // oops
        if (!page) return
        this.goToPage(page.index);
    }

    getFirstUserPage() {
        var first = this.userStoryPages[0]
        return first ? first : null
    }
    getNextUserPage(page = null) {
        let nextUserIndex = 0
        if (!page) page = this.currentPage
        if (page) nextUserIndex = page.userIndex + 1
        if (nextUserIndex >= this.userStoryPages.length) nextUserIndex = 0
        return this.userStoryPages[nextUserIndex]
    }
    getNextVisPage(page, loopSearch = true) {
        let nexVisIndex = page ? page.visIndex + 1 : 0
        if (nexVisIndex >= this.visStoryPages.length)
            if (loopSearch) nexVisIndex = 0; else return null
        return this.visStoryPages[nexVisIndex]
    }
    getPreviousUserPage(page) {
        var prevUserIndex = page ? page.userIndex - 1 : -1
        if (prevUserIndex < 0) return null
        return this.userStoryPages[prevUserIndex]
    }
    toggleLinks(newState = undefined, updateToogler = true) {
        this.highlightLinks = newState != undefined ? newState : !this.highlightLinks
        if (updateToogler) this.refresh_update_links_toggler(this.currentPage)
        this._updateLinksState()
    }
    toogleLayout(newState = undefined, updateToogler = true) {
        this.showLayout = newState != undefined ? newState : !this.showLayout
        if (updateToogler) $("#menu #pagegrid").prop('checked', this.showLayout);
        const div = $('#content')

        if (this.showLayout) {
            this.currentPage.showLayout()
            div.addClass("contentLayoutVisible")
        } else
            div.removeClass("contentLayoutVisible")
    }
    toogleFullScreen(newState = undefined, updateToogler = true) {
        this.isFullScreen = newState != undefined ? newState : !this.isFullScreen
        if (updateToogler) $("#menu #fullScreen").prop('checked', this.isFullScreen);
        //
        return this.isFullScreen ? this._enableFullScreen() : this._disableFullScreen()
    }
    //
    toogleUI(newState = undefined, updateToogler = true) {
        this.showUI = newState != undefined ? newState : !this.showUI
        if (updateToogler) $("#menu #ui").prop('checked', this.showUI);
        $('#nav').slideToggle('fast')
    }
    _updateLinksState(showLinks = undefined, div = undefined) {
        if (undefined == div) {
            if (this.currentPage.isModal) {
                div = $('#content-modal')
            } else {
                div = $('#content')
            }
        }
        if (undefined == showLinks) showLinks = this.highlightLinks
        if (showLinks)
            div.addClass("contentLinksVisible")
        else
            div.removeClass("contentLinksVisible")
    }

    showHints() {
        var text = this.currentPage.annotations;
        if (text == undefined) return;
        alert(text);
    }

    handleStateChanges(e) {
        if(this.stateChangeIgnore){
            this.stateChangeIgnore = false
            return
        }

        viewer.urlLocked = true
        viewer.currentPage.hide(true, true)
        viewer.currentPage = null

        viewer.initParseGetParams()
        viewer.handleNewLocation(true)
        viewer.urlLocked = false
    }

    _enableFullScreen() {
        ///
        const elem = document.documentElement
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();

        }
        //
        const changeHandler = function (event) {
            if (document.webkitIsFullScreen === false || document.mozFullScreen === false || document.msFullscreenElement === false) {
                presenterViewer.stop(false)
            }
        }
        document.addEventListener("fullscreenchange", changeHandler, false);
        document.addEventListener("webkitfullscreenchange", changeHandler, false);
        document.addEventListener("mozfullscreenchange", changeHandler, false);
    }

    _disableFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// ADD | REMOVE CLASS
// mode ID - getELementByID
// mode CLASS - getELementByClassName

function addRemoveClass(mode, el, cls) {

    var el;

    switch (mode) {
        case 'class':
            el = document.getElementsByClassName(el)[0];
            break;

        case 'id':
            el = document.getElementById(el);
            break;
    }

    if (el.classList.contains(cls)) {
        el.classList.remove(cls)
    } else {
        el.classList.add(cls);
    }
}

function handleStateChanges(e) {   
    viewer.handleStateChanges(e)
}

$(document).ready(function () {
    viewer.initialize();
    if (!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) {
        $('body').removeClass('screen');
    }

    viewer.handleNewLocation(true)
    if (!viewer.isEmbed) preloadAllPageImages();

    window.addEventListener('popstate', handleStateChanges);
    $(window).hashchange(handleStateChanges);

    viewer.zoomContent()
    viewer.initializeLast()
});
