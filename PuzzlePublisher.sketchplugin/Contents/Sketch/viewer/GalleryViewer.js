const GALLERY_TOP_MARGIN = 80
const GALLERY_LEFTRIGH_MARGIN = 40


class GalleryViewerMapLink {
    constructor(index, link, spage, dpage) {
        this.index = index
        this.link = link
        this.spage = spage
        this.dpage = dpage
        //
        if (undefined == spage.slinks) spage.slinks = []
        if (undefined == dpage.dlinks) dpage.dlinks = []
        spage.slinks.push(this)
        dpage.dlinks.push(this)
    }

    buildCode(zoom, visible) {
        const page = this.spage
        const dpage = this.dpage
        const l = this.link
        let svg = ""
        //
        var lsx = l.rect.x + l.rect.width / 2 + page.finalLeft
        var lsy = l.rect.y + l.rect.height / 2 + page.finalTop
        //
        var ldx0 = dpage.finalLeft
        var ldx1 = dpage.finalLeft + dpage.width
        var ldy0 = dpage.finalTop
        var ldx = 0, ldy = 0, dc = 0
        // find the best target edge to connect with
        if (ldx0 > lsx) {
            ldx = ldx0
            ldy = ldy0 + dpage.height / 2
            lsx += l.rect.width / 2 // place start to hotspot right edge
            dc = 50
        } else if (lsx > ldx1) {
            ldx = ldx1
            ldy = ldy0 + dpage.height / 2
            lsx -= l.rect.width / 2 // place start to hotspot left edge
            dc = 50
        } else if (ldy0 > lsy) {
            lsy += l.rect.height / 2
            ldx = ldx0 + dpage.width / 2
            ldy = ldy0
            dc = 0
        } else {
            lsy -= l.rect.height / 2
            ldx = ldx0 + dpage.width / 2
            ldy = ldy0 + dpage.height
            dc = 0
        }
        //
        //
        const styleCode = visible ? "" : " style='display:none' "
        svg += "<path " + styleCode + "marker-end='url(#arrow)' id='l" + this.index + "' d='M "
            + Math.round(lsx * zoom) + " "
            + Math.round(lsy * zoom) + " "
            + "q "
            + Math.round((ldx - lsx) / 2 * zoom) + " "
            + dc + " "
            + Math.round((ldx - lsx) * zoom) + " "
            + Math.round((ldy - lsy) * zoom) + " "
            + "'/>"
        //
        svg += "<circle " + styleCode + "' id='s" + this.index + "' cx='" + Math.round(lsx * zoom) + "' cy='" + Math.round(lsy * zoom) + "' r='3'/>"
        //
        return svg
    }
}

class GalleryViewer extends AbstractViewer {
    constructor() {
        super()
        this.isSidebarChild = false
        this.blockMainNavigation = true
        this.enableTopNavigation = true
        this.mapLinks = null
        this.mapFocusedPage = null
        this.isMapMode = false
        //
        const restoredMode = window.localStorage.getItem("galleryIsModeAbs") == "true"
        if (null != restoredMode) this.isMapMode = restoredMode
        $("#gallery-header-container #right #galleryShowMap").prop('checked', this.isMapMode);
        //
        this.isMapLinksVisible = false
        if (window.localStorage.getItem("galleryIsLinkVisible") == "true") this.isMapLinksVisible = true
        $("#map-controls #map-controls-container #galleryShowMapLinks").prop('checked', this.isMapLinksVisible);
        //
        this.mapZoom = 0.2
        this.isCustomMapZoom = false
        this.currentFullWidth = null

        this.searchInputFocused = false
    }

    initialize(force = false, skipZoomUpdate = false) {
        if (!force && this.inited) return

        // Load page comment counters
        if (viewer.commentsViewer) {
            var formData = new FormData();
            viewer.commentsViewer.askCommentCounters(function () {
                var result = JSON.parse(this.responseText);
                //
                if ("ok" == result.status) {
                    viewer.galleryViewer._updateCommentCounters(result.data)
                } else {
                    console.log(result.message);
                }
                return
            })
        }

        // adjust main container for current mode
        if (this.isMapMode) {
            $("#gallery").removeClass("gallery-grid")
        } else {
            $("#gallery").addClass("gallery-grid")
        }

        $('#gallery #grid').empty()
        this.loadPages();

        //load amount of pages to gallery title
        document.getElementById("screensamount").innerHTML = viewer.userStoryPages.length + " screens";

        // Adjust map zoom
        const zoomContainter = $("#map-controls")
        if (this.isMapMode) {
            if (!skipZoomUpdate) {
                const zoomControl = $(".mapZoom")
                zoomControl.val(this.mapZoom * 100)
            }
            zoomContainter.show();
        } else {
            zoomContainter.hide()
        }

        this.inited = true
    }

    _updateCommentCounters(pagesInfo) {
        viewer.userStoryPages.forEach(function (page) {
            const pageID = page.getHash()
            const pageInfo = pagesInfo[pageID]
            if (!pageInfo) {
                console.log("Can't find page info for " + pageID);
                return
            }
            //
            let text = ""
            if (pageInfo['commentsTotal'] != 0) text = "  (" + pageInfo['commentsTotal'] + ")"
            //
            if (this.isMapMode) {
                $("#gallery #grid #t" + page.index + " #comm").text(text)
            } else {
                $("#gallery #grid #" + page.index + " #comm").text(text)
            }

        }, this);
    }

    handleKeyDown(jevent) {
        const event = jevent.originalEvent

        if (27 == event.which) { // esc
            this.toggle()
        } else if (!this.searchInputFocused && 71 == event.which && !event.metaKey) { // key "g"
            // Key "G" activates/deactivates Symbol Viewer
            this.toggle()
        } else if (this.searchInputFocused) {
            return true
        } else if (76 == event.which) { // key "l"
            $("#galleryShowMapLinks").click()
        } else if (77 == event.which) { // key "m"
            $("#galleryShowMap").click()
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    mapZoomChanged(zoomValue) {
        this.mapZoom = zoomValue / 200
        this.isCustomMapZoom = true
        this.initialize(true, true)
    }

    viewerResized() {
        if (!this.isMapMode) return
        this.initialize(true)
    }

    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (71 == event.which && !event.metaKey) { // g
            // Key "G" activates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }

    /// calling from parent
    handleURLParam(paramValue) {
        const enableMap = "m" == paramValue
        if (enableMap != this.isMapMode) {
            this.enableMapMode(enableMap)
            $("#galleryShowMap").prop('checked', enableMap);
        }
    }

    // Calling from UI
    enableMapMode(enabled) {
        window.localStorage.setItem("galleryIsModeAbs", enabled)
        this.isMapMode = enabled
        this.initialize(true)
        viewer.refresh_url(viewer.currentPage, "", false)
    }

    // Calling from UI
    showMapLinks(visible) {
        window.localStorage.setItem("galleryIsLinkVisible", visible)
        this.isMapLinksVisible = visible
        this._showHideMapLinks(visible ? null : false)
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

        // Redraw search results
        this.onSearchInputChange()
        viewer.refresh_url(viewer.currentPage, "", false)
    }

    _hideSelf() {
        $('#gallery-modal').addClass('hidden');
        super._hideSelf()
        viewer.refresh_url(viewer.currentPage, "", false)
    }



    loadPages() {
        if (this.isMapMode) return this.loadPagesAbs()
        viewer.userStoryPages.forEach(function (page) {
            this.loadOnePage(page);
        }, this);
    }

    loadPagesAbs() {
        let groupSpace = 80

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
                page.group = group
                page.slinks = []
                page.dlinks = []
                //
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
            group.height = bottom - top
        }, this);

        // Calculate zoom to fit max width
        if (!this.isCustomMapZoom) {
            this.mapZoom = (viewer.fullWidth - GALLERY_LEFTRIGH_MARGIN * 2) / maxGroupWidth
            if (this.mapZoom > 0.6) this.mapZoom = 0.6
        }
        this.currentFullWidth = viewer.fullWidth

        // show pages using their coordinates and current zoom
        let deltaY = 0
        let fullHeight = 0
        const groupTitleHeight = 40 / this.mapZoom
        story.groups.forEach(function (group) {
            if (group.pages.length == 0) return
            ///
            let top = deltaY - group.top
            const left = group.left
            group.finalTop = deltaY
            top += groupTitleHeight
            //// show group title
            this.addMapPageGroupTitle(group)
            //// show pages
            group.pages.forEach(function (page) {                //
                this.loadOnePageAbs(page, left, top);
            }, this);
            //
            fullHeight += group.height
            //
            deltaY += group.height + groupSpace + groupTitleHeight + 30
        }, this);
        fullHeight = deltaY //+= groupSpace * (story.groups.length - 1)

        //
        this._buildMapLinks(maxGroupWidth, fullHeight)
    }


    addMapPageGroupTitle(group) {
        let style = this._valueToStyle("left", 0, GALLERY_LEFTRIGH_MARGIN) + this._valueToStyle("top", group.finalTop, GALLERY_TOP_MARGIN)

        var div = $('<div/>', {
            id: "g" + group.id,
            class: "groupTitle",
            style: style,
        });
        div.html(group.name)
        div.appendTo($('#gallery #grid'));

    }


    selectPage(index) {
        this.hide()
        viewer.goToPage(index, this.actualSearchText)
    }

    mouseEnterPage(index) {
        if (this.isMapLinksVisible) return
        //
        if (this.mapFocusedPage) this.mapFocusedPage.showHideGalleryLinks(false)
        const page = story.pages[index]
        page.showHideGalleryLinks(true)
        this.mapFocusedPage = page
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

        var spanTitle = $('<span/>', {
            id: "page-title",
            alt: page.title,
        });
        spanTitle.appendTo(divTitle);

        var title = $('<div/>', {
            text: page.title
        });
        title.appendTo(spanTitle);

        if (viewer.commentsViewer) {
            var comments = $('<div/>', {
                id: "comm",
                text: ""
            });
            comments.appendTo(spanTitle);
        }

        divTitle.appendTo(divMain);
    }

    loadOnePageAbs(page, pageLeft, pageTop) {
        page.finalTop = pageTop + page.y
        page.finalLeft = page.x - pageLeft

        {
            let style = this._valueToStyle("left", page.finalLeft, GALLERY_LEFTRIGH_MARGIN) + this._valueToStyle("top", page.finalTop, GALLERY_TOP_MARGIN)
                + this._valueToStyle("width", page.width) + this._valueToStyle("height", page.height)
            if (undefined != story.backColor) {
                style += "background-color:" + story.backColor + ";"
            }

            var div = $('<div/>', {
                id: page.index,
                class: "galleryArtboardAbs",
                style: style,
            });

            div.click(function (e) {
                viewer.galleryViewer.selectPage(parseInt(this.id));
            });
            div.mouseenter(function () {
                viewer.galleryViewer.mouseEnterPage(this.id)
            })
            div.appendTo($('#gallery #grid'));

            const width = Math.round(this.mapZoom * page.width)
            // Show large image for large width
            const previewWidth = 522
            let src = encodeURIComponent(viewer.files)
            if (width < previewWidth) {
                src += '/previews/' + encodeURIComponent(page.image)
            } else {
                src += '/full/' + encodeURIComponent(page.image)
            }

            var img = $('<img/>', {
                class: "gallery-map-image",
                alt: page.title,
                width: width,
                height: Math.round(this.mapZoom * page.height) + "px",
                src: src
            });
            img.appendTo(div);
        }

        /// add title
        {
            let style = this._valueToStyle("left", page.finalLeft, GALLERY_LEFTRIGH_MARGIN) + this._valueToStyle("top", page.finalTop + page.height, GALLERY_TOP_MARGIN)
                + this._valueToStyle("width", page.width) //+ this._valueToStyle("height", 20)
            var div = $('<div/>', {
                id: "t" + page.index,
                class: "galleryArtboardLabelAbs",
                style: style,
            });
            div.text(page.title)
            div.appendTo($('#gallery #grid'))
            var span = $('<span/>', {
                id: "comm"
            });
            span.appendTo(div)
        }

    }

    _valueToStyle(styleName, v, absDelta = 0) {
        return styleName + ": " + Math.round(v * this.mapZoom + absDelta) + "px;"
    }

    _showHideMapLinks(show) {
        viewer.userStoryPages.forEach(function (page) {
            page.showHideGalleryLinks(show)
        });
    }


    _buildMapLinks(finalWidth, finalHeight) {

        // build scene
        let svg = "<svg"
            + " height='" + Math.abs(Math.round(finalHeight * this.mapZoom)) + "'"
            + " width='" + Math.abs(Math.round(finalWidth * this.mapZoom)) + "'"
            + " >"
        svg += `
            <defs>
             <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="6" markerHeight="6" fill="#F89000"
                orient="auto">
                 <path d="M 0 0 L 10 5 L 0 10 z" fill="#F89000"/>
             </marker>
            </defs>
        `
        //
        let indexCounter = 0
        this.mapLinks = []
        //
        viewer.userStoryPages.forEach(function (page) {
            /// Show links to other pages
            page.links.forEach(function (l) {
                // valide destination page
                if (l.page == page.index) return
                const dpage = story.pages[l.page]
                if (!dpage || "external" == dpage.type || "overlay" == dpage.type) return
                // build SVG coode for the link
                const link = new GalleryViewerMapLink(indexCounter++, l, page, dpage)
                svg += link.buildCode(this.mapZoom, this.isMapLinksVisible)
                this.mapLinks.push(link)
            }, this)
        }, this)

        svg += "</svg>"
        $('#gallery #grid').append(svg)
    }

    //Search page in gallery by page name
    onSearchInputChange() {
        var keyword = $("#searchInput").val().toLowerCase().trim()
        if (undefined == this.actualSearchText && "" == keyword) return

        var foundScreenAmount = 0;

        viewer.userStoryPages.forEach(function (page) {
            const title = page.title.toLowerCase().trim()
            const div = $("#gallery #grid #" + page.index)
            let visible = keyword == ''
            let foundTextLayers = []

            // Reset prev results
            div.find(".searchFocusedResultDiv,.searchResultDiv").remove()

            // Search in artboard title and image name            
            if (keyword != '') {
                visible = title.includes(keyword) || page.image.includes(keyword)

                // Search in text layers                
                page.findTextLayersByText(keyword, foundTextLayers)
                if (foundTextLayers.length > 0) {
                    visible = true
                }
                //
            }

            if (visible) foundScreenAmount++
            page.visibleInGallery = visible
            if (visible) {
                div.show()
                if (visible) {
                    foundTextLayers.forEach(function (l) {
                        viewer.galleryViewer._findTextShowElement(page, l, div)
                    })
                }
            } else {
                div.hide()
            }
        });

        // Final procedures
        this.actualSearchText = keyword != '' ? keyword : undefined
        viewer.galleryViewer._showHideMapLinks()

        //load amount of pages to gallery title
        $("#screensamount").html(foundScreenAmount + " screens")
    }

    _findTextShowElement(page, l, div) {
        const isFocused = true
        const padding = isFocused ? 2 : 0
        const divWidth = div.innerWidth()
        const zoom = page.width / divWidth

        let x = l.x / zoom
        let y = l.y / zoom

        // show layer border
        var style = "left: " + x + "px; top:" + y + "px; "
        style += "width: " + (l.w / zoom + padding * 2) + "px; height:" + (l.h / zoom + padding * 2) + "px; "
        var elemDiv = $("<div>", {
            class: isFocused ? "searchFocusedResultDiv" : "searchResultDiv",
        }).attr('style', style)

        elemDiv.appendTo(div)
    }

}
