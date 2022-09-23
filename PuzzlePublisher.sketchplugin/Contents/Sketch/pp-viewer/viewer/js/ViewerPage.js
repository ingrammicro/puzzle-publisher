
///
const Constants = {
    ARTBOARD_OVERLAY_PIN_HOTSPOT: 0,
    ARTBOARD_OVERLAY_PIN_PAGE: 1,
    //
    ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_LEFT: 0,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_CENTER: 1,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_RIGHT: 2,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT: 3,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_CENTER: 4,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_RIGHT: 5,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_BOTTOM_RIGHT: 6,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_UP_CENTER: 7,
    ARTBOARD_OVERLAY_PIN_HOTSPOT_RELATIVE: 8,
    //
    ARTBOARD_OVERLAY_PIN_PAGE_TOP_LEFT: 0,
    ARTBOARD_OVERLAY_PIN_PAGE_TOP_CENTER: 1,
    ARTBOARD_OVERLAY_PIN_PAGE_TOP_RIGHT: 2,
    ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_LEFT: 3,
    ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_CENTER: 4,
    ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_RIGHT: 5,
    ARTBOARD_OVERLAY_PIN_PAGE_CENTER: 6,

    TRIGGER_ON_CLICK: 0,
    TRIGGER_ON_HOVER: 1,

    LAYER_VSCROLL_NONE: 0,
    LAYER_VSCROLL_DEFAULT: 1,
    LAYER_VSCROLL_ALWAYS: 2,
    LAYER_VSCROLL_NEVER: 3,
}

const EVENT_HOVER = 1
const TRANS_ANIM_NONE = 0
let TRANS_ANIMATIONS = [
    {},
    { in_str_classes: ".transit .slideInUp", out_str_classes: ".transit .slideOutUp", in_token: "transition-slidein-up", out_token: "transition-slideout-up" },
    { in_str_classes: ".transit .slideInLeft", out_str_classes: ".transit .slideOutLeft", in_token: "transition-slidein-left", out_token: "transition-slideout-left" },
    { in_str_classes: ".transit .fadeIn", out_str_classes: ".transit .fadeOut", in_token: "transition-fadein_str_classes:", out_token: "transition-fadeout" },
    { in_str_classes: ".transit .slideInRight", out_str_classes: ".transit .slideOutRight", in_token: "transition-slidein-right", out_token: "transition-slideout-right" },
    { in_str_classes: ".transit .slideInDown", out_str_classes: ".transit .slideOutDown", in_token: "transition-slidein-down", out_token: "transition-slideout-down" },
]



function inViewport($el)
{
    // source: https://stackoverflow.com/questions/24768795/get-the-visible-height-of-a-div-with-jquery
    var elH = $el.outerHeight(),
        H = $(window).height(),
        r = $el[0].getBoundingClientRect(), t = r.top, b = r.bottom;
    return [r.top, Math.max(0, t > 0 ? Math.min(elH, H - t) : Math.min(b, H))]
}

function handleAnimationEndOnHide(el)
{
    el.target.removeEventListener("animationend", handleAnimationEndOnHide)
    const t = TRANS_ANIMATIONS[el.target.getAttribute("_tch")]
    t.out_classes.forEach(function (className)
    {
        el.target.classList.remove(className)
    })
    el.target.classList.add("hidden")
}

function handleAnimationEndOnShow(el)
{
    el.target.removeEventListener("animationend", handleAnimationEndOnShow)
    const t = TRANS_ANIMATIONS[el.target.getAttribute("_tcs")]
    t.in_classes.forEach(function (className)
    {
        el.target.classList.remove(className)
    })
}

class ViewerPage
{

    constructor()
    {
        this.currentOverlays = []
        this.parentPage = undefined

        this.visible = false
        this.image = undefined
        this.imageDiv = undefined
        this.imageObj = undefined

        this.currentLeft = undefined
        this.currentTop = undefined

        this.currentX = undefined
        this.currentY = undefined

        // this.searchLayer  = undefined

        this.overlayByEvent = undefined
        this.tmpSrcOverlayByEvent = undefined

        this.visibleInGallery = true
    }

    showHideGalleryLinks(show = null)
    {

        if (this.slinks) this._showHideGalleryLinkSet(this.slinks, show)
        if (this.dlinks) this._showHideGalleryLinkSet(this.dlinks, show)
    }

    _showHideGalleryLinkSet(links, forceShow = null)
    {
        links.forEach(function (link)
        {
            let show = forceShow != null ? forceShow : this.visibleInGallery && link.dpage.visibleInGallery && link.spage.visibleInGallery
            // hide link
            const o = $("#gallery #grid svg #l" + link.index)
            if (show) o.show(); else o.hide()
            // hide start point
            const sp = $("#gallery #grid svg #s" + link.index)
            if (show) sp.show(); else sp.hide()
        }, this)
    }

    getHash()
    {
        var image = this.image;
        return image.substring(0, image.length - 4); // strip .png suffix
    }

    hide(hideChilds = false, disableAnim = false)
    {
        if (!disableAnim && TRANS_ANIM_NONE != this.transAnimType && !this.isModal)
        {
            const transInfo = TRANS_ANIMATIONS[this.transAnimType]
            const el = this.imageDiv.get(0)
            el.setAttribute("_tch", this.transAnimType)
            transInfo.out_classes.forEach(function (className)
            {
                this.imageDiv.addClass(className)
            }, this)
            el.addEventListener("animationend", handleAnimationEndOnHide)
        } else
        {
            this.imageDiv.addClass("hidden")
        }

        if (undefined != this.parentPage)
        { // current page is overlay      

            if (hideChilds) this.hideChildOverlays()

            const parent = this.parentPage
            viewer.stateChangeIgnore = true
            viewer.refresh_url(parent)
            // remove this from parent overlay
            const index = parent.currentOverlays.indexOf(this)
            parent.currentOverlays.splice(index, 1)
            this.parentPage = undefined
        } else
        {
            this.hideCurrentOverlays()
        }

        if (undefined != this.tmpSrcOverlayByEvent)
        {
            this.overlayByEvent = this.tmpSrcOverlayByEvent
            this.tmpSrcOverlayByEvent = undefined
        }
        // Cleanup
        this.visible = false
        this.currentLink = null
    }

    hideCurrentOverlays()
    {
        const overlays = this.currentOverlays.filter(p => p.overlayOutsideClickIgnore != true).slice()
        for (let overlay of overlays)
        {
            overlay.hide()
        }
        return overlays.length > 0
    }

    hideChildOverlays()
    {
        const overlays = this.parentPage.currentOverlays.slice()
        for (let overlay of overlays)
        {
            if (overlay.currentLink.orgPage != this) continue
            overlay.hide()
        }
    }

    hideOtherParentOverlays()
    {
        const overlays = this.parentPage.currentOverlays.slice()
        for (let overlay of overlays)
        {
            if (overlay == this) continue
            overlay.hide()
        }
    }


    show(disableAnim = false)
    {
        if (!this.imageObj) this.loadImages(true)

        this.updatePosition()

        if (!disableAnim && TRANS_ANIM_NONE != this.transAnimType && !this.isModal)
        {
            const transInfo = TRANS_ANIMATIONS[this.transAnimType]
            const el = this.imageDiv.get(0)
            el.setAttribute("_tcs", this.transAnimType)
            transInfo.in_classes.forEach(function (className, index)
            {
                this.imageDiv.addClass(className)
            }, this)
            el.addEventListener("animationend", handleAnimationEndOnShow)
        } else
        {
        }
        this.imageDiv.removeClass("hidden")
        this.visible = true
    }

    // result:{
    //    foundPage: {}
    //    foundlink: {}
    //}
    showOverlayOverParent()
    {
        var foundPage = null
        var foundLink = null
        // scan all regular pages
        story.pages.filter(page => "regular" == page.type).some(function (page)
        {
            const foundLinks = page.links.filter(link => link.page != null && link.page == this.index)
            if (foundLinks.length != 0)
            {
                // return the page index which has link to modal                    
                foundPage = page
                foundLink = foundLinks[0]
                return true
            }
            return false
        }, this)
        if (!foundPage) return false

        // ok, we found some regular page which has a link to specified overlay        
        viewer.goTo(foundPage.index, true);
        foundPage.showOverlayByLinkIndex(foundLink.index)

        return true
    }

    findTextNext()
    {
        if (undefined == this.textElemIndex) return false
        //
        //this.textElemIndex++
        this.findText(this.actualSearchText)
    }

    findText(text, interactive = true)
    {
        text = text.toLowerCase().trim()
        //        
        if (undefined != this.actualSearchText && this.actualSearchText != text)
        {
            this.textElemIndex = undefined
            this.actualSearchText = undefined
        }
        if (undefined == this.textElemIndex) this.textElemIndex = 0

        // Search all layers with required text inside
        let foundLayers = []
        this.findTextLayersByText(text, foundLayers)
        foundLayers.sort(function (a, b)
        {
            return a.y < b.y ? -1 : 1
        })
        //  No results
        if (0 == foundLayers.length)
        {
            if (!interactive) return false
            const nextPage = this.findNextPageWithText(text)
            if (!nextPage)
            {
                window.alert("The text was not found")
                return false
            }
            if (!window.confirm("Not found on the current page. Do you want to check other pages?"))
            {
                return false
            }
            viewer.goTo(nextPage.index)
            return true
        }
        if (foundLayers.length <= this.textElemIndex)
        {
            // No more results ahead
            if (interactive)
            {
                const nextPage = this.findNextPageWithText(text)
                if (nextPage)
                {
                    if (window.confirm("The last result found on the current page. Do you want to check other pages?"))
                    {
                        //this.stopTextSearch()
                        viewer.goTo(nextPage.index)
                        return true
                    }
                }
            }
            this.textElemIndex = 0
        }
        // Highlight results
        this.hideFoundTextResults()
        foundLayers.forEach(function (l, index)
        {
            this._findTextShowElement(l, index == this.textElemIndex)
        }, this)
        //
        this.actualSearchText = text
        if ((foundLayers.length + 1) > this.textElemIndex) this.textElemIndex++
        //
        return foundLayers.length > 0
    }

    findNextPageWithText(text)
    {
        let foundPage = null
        let page = this
        while (true)
        {
            // if we have some next pages?
            const nextPage = viewer.getNextVisPage(page)
            if (!nextPage) break
            // we don't want to run infinity loop
            if (nextPage.index == this.index) break
            // if a next page has this text
            if (nextPage.findText(text, false))
            {
                foundPage = nextPage
                break
            }
            page = nextPage
        }
        return foundPage
    }

    // Arguments:
    //  foundLayers: ref to list result
    //  layers: list of layers or null (to get a root layers)
    findTextLayersByText(text, foundLayers, layers = null)
    {
        if (!story.layersExist) return false
        if (null == layers)
        {
            layers = layersData[this.index].c
            if (!layers) return false
        }

        for (var l of layers.slice().reverse())
        {
            if ("Text" == l.tp && l.tx.toLowerCase().includes(text))
            {
                foundLayers.push(l)
            }
            if (undefined != l.c)
                this.findTextLayersByText(text, foundLayers, l.c)
        }
    }
    _findTextShowElement(l, isFocused = false)
    {
        const padding = isFocused ? 5 : 0
        let x = l.x - padding
        let y = l.y - padding

        // show layer border
        var style = "left: " + x + "px; top:" + y + "px; "
        style += "width: " + (l.w + padding * 2) + "px; height:" + (l.h + padding * 2) + "px; "
        var elemDiv = $("<div>", {
            class: isFocused ? "searchFocusedResultDiv" : "searchResultDiv",
        }).attr('style', style)

        elemDiv.appendTo(this.linksDiv)

        // scroll window to show a layer
        if (isFocused)
        {
            this._scrollTo(l.x, l.y)
        }
    }

    _scrollTo(x, y)
    {
        for (let p of this.fixedPanels)
        {
            if (Math.round(p.y) == 0)
            {
                y -= p.height
                break
            }
        }
        window.scrollTo(x, y - 10);
    }

    hideFoundTextResults()
    {
        $(".searchResultDiv").remove()
        $(".searchFocusedResultDiv").remove()
    }

    stopTextSearch()
    {
        this.hideFoundTextResults()
        this.actualSearchText = undefined
        this.textElemIndex = undefined
    }

    updatePosition()
    {
        this.currentLeft = viewer.currentMarginLeft
        this.currentTop = viewer.currentMarginTop

        if (this.isModal)
        {
            var regPage = viewer.lastRegularPage

            this.currentLeft += Math.round(regPage.width / 2) - Math.round(this.width / 2)
            const [y, visibleHeight] = inViewport(regPage.imageDiv)
            this.currentTop += Math.round(visibleHeight / 2) - Math.round(this.height / 2 * viewer.currentZoom)
            if (this.currentTop < 0) this.currentTop = 0
            if (this.currentLeft < 0) this.currentLeft = 0

            var contentModal = $('#content-modal');
            contentModal.css("margin-left", this.currentLeft + "px")
            contentModal.css("margin-top", this.currentTop + "px")
            if (this.height >= visibleHeight)
                contentModal.css("overflow-y", "scroll")
            else
                contentModal.css("overflow-y", "")
        } else if ("overlay" == this.type)
        {
            this.currentLeft = viewer.currentPage ? viewer.currentPage.currentLeft : 0
            this.currentTop = viewer.currentPage ? viewer.currentPage.currentTop : 0
        }
        // Update fixed layers position)
        /*let py = null, ph = null
        this.fixedPanels.filter(p => !p.constrains.top && p.constrains.bottom).forEach(p =>
        {            
            if (py === null) [py, ph] = inViewport(this.imageDiv)
            if(viewer.currentZoom>=1)
                p.imageDiv.css("top", (py + ph - p.height) + "px")
            else
                p.imageDiv.css("top", (this.height - p.height) + "px")
        }, this)*/
    }

    showOverlayByLinkIndex(linkIndex)
    {
        linkIndex = parseInt(linkIndex, 10)

        var link = this._getLinkByIndex(linkIndex)
        if (!link)
        {
            console.log('Error: can not find link to overlay by index="' + linkIndex + '"')
            return false
        }

        // can handle only page-to-page transition
        if ((link["page"] == undefined)) return false

        var destPage = story.pages[link.page]
        // for mouseover overlay we need to show it on click, but only one time)
        if ("overlay" == destPage.type && Constants.TRIGGER_ON_HOVER == destPage.overlayByEvent)
        {
            destPage.tmpSrcOverlayByEvent = destPage.overlayByEvent
            destPage.overlayByEvent = Constants.TRIGGER_ON_HOVER
            viewer.customEvent = {
                x: link.rect.x,
                y: link.rect.y,
                pageIndex: this.index,
                linkIndex: link.index
            }
            handleLinkEvent({})
            viewer.customEvent = undefined
        } else
        {
            link.a.click()
        }
    }

    // return true (overlay is hidden) or false (overlay is visible)
    onMouseMove(x, y)
    {
        for (let overlay of this.currentOverlays)
        {
            // Commented to hide mouseover-overlay inside onclick-overlay  (ver 12.4.3)
            //if (overlay.currentLink.orgPage != this) continue 
            overlay.onMouseMoveOverlay(x, y)
        }
    }

    // return true (overlay is hidden) or false (overlay is visible)
    onMouseMoveOverlay(x, y)
    {
        if (this.imageDiv.hasClass("hidden") || this.overlayByEvent != Constants.TRIGGER_ON_HOVER) return false
        if (viewer.linksDisabled) return false

        // handle mouse hover if this page is overlay
        var _hideSelf = false
        while (true)//Constants.TRIGGER_ON_CLICK == this.overlayByEvent)
        {
            var localX = Math.round(x / viewer.currentZoom) - this.currentLeft
            var localY = Math.round(y / viewer.currentZoom) - this.currentTop
            //alert(" localX:"+localX+" localY:"+localY+" linkX:"+this.currentLink.x+" linkY:"+this.currentLink.y);


            if ( // check if we inside in overlay
                localX >= this.currentX
                && localY >= this.currentY
                && localX < (this.currentX + this.width)
                && localY < (this.currentY + this.height)
            )
            {
                break
            }

            if ( // check if we out of current hotspot
                localX < this.currentLink.x
                || localY < this.currentLink.y
                || localX >= (this.currentLink.x + this.currentLink.width)
                || localY >= (this.currentLink.y + this.currentLink.height)
            )
            {
                _hideSelf = true
                break
            }
            break
        }

        // allow childs to handle mouse move
        var visibleTotal = 0
        var total = 0

        for (let overlay of this.parentPage.currentOverlays)
        {
            if (overlay.currentLink.orgPage != this) continue
            total++
            if (overlay.onMouseMoveOverlay(x, y)) visibleTotal++
        }

        if (_hideSelf)
            if (!total || (total && !visibleTotal))
            {
                this.hide(false)
                return false
            }

        return true
    }


    showAsOverlayInCurrentPage(orgPage, link, posX, posY, linkParentFixed, disableAnim)
    {
        const newParentPage = viewer.currentPage

        if (!this.imageDiv) this.loadImages(true)
        if(link.panel===undefined) link.panel = this

        // check if we need to hide any other already visible overlay
        var positionCloned = false
        const currentOverlays = newParentPage.currentOverlays

        let overlayIndex = currentOverlays.indexOf(this.index)
        if (overlayIndex < 0)
        {
            if ('overlay' !== link.orgPage.type || this.overlayClosePrevOverlay)
            {
                // if we show new overlay by clicking inside other overlay then we close the original overlay
                if ('overlay' == orgPage.type && this.overlayClosePrevOverlay)
                {
                    orgPage.hide()
                } else
                {
                    for (let overlay of currentOverlays)
                    {
                        if (overlay == this) continue
                        overlay.hide()
                    }
                }
            }
        }

        // Show overlay on the new position
        const div = this.imageDiv

        this.inFixedPanel = linkParentFixed && (this.overlayAlsoFixed || link.panel.isVertScroll)
        if (!this.parentPage || this.parentPage.id != newParentPage.id || div.hasClass('hidden'))
        {
            if(link.panel.isVertScroll){
                div.removeClass('fixedPanelFloat') 
                div.addClass('divPanel')
            }
            else if (this.inFixedPanel)
            {
                div.removeClass('divPanel')
                div.addClass('fixedPanelFloat')
            } else if (newParentPage.isModal)
            {
                //div.removeClass('divPanel')
                //div.removeClass('fixedPanelFloat')        
            } else
            {
                div.removeClass('fixedPanelFloat') // clear after inFixedPanel
                div.addClass('divPanel')
            }

            // click on overlay outside of any hotspots should not close it
            div.click(function ()
            {
                const index = parseInt(this.id.substring(this.id.indexOf("_") + 1))
                if (index >= 0)
                {
                    const page = story.pages[index]
                    const indexOverlay = page.parentPage.currentOverlays.indexOf(page)
                    if (indexOverlay == 0) page.hideOtherParentOverlays()
                }
                return false
            })

            if (link.fixedBottomPanel)
            {
                // show new overlay aligned to bottom
                const panel = link.fixedBottomPanel;
                const panelLink = panel.links[link.index]
                posX = panel.x + panelLink.rect.x
                posY = orgPage.height - panel.y - panelLink.rect.y// + panelLink.rect.height)

                // check page right border
                if ((posX + this.width) > orgPage.width) posX = orgPage.width - this.width

                newParentPage.imageDiv.append(div)
                div.css('top', "")
                div.css('bottom', posY)
                div.css('margin-left', posX + "px")
            } else
            {
                // 
                if (!this.overlayClosePrevOverlay && !positionCloned && undefined != this.overlayShadowX &&
                    (
                        (0 == this.overlayPin) // ARTBOARD_OVERLAY_PIN_HOTSPOT
                        && (3 == this.overlayPinHotspot) //ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT
                    )
                ){
                    posX -= this.overlayShadowX
                }
                if(link.panel.isVertScroll){
                    posY-=link.panel.y
                    //if(orgPage.type==="modal") posY+=orgPage.
                }

                this.currentX = posX
                this.currentY = posY
                
                if (link.panel.isVertScroll){
                    link.panel.imageDiv.append(div)
                }else if ("modal" == orgPage.type) 
                    newParentPage.imageDiv.append(div)
                div.css('top', posY + "px")
                div.css('margin-left', posX + "px")
            }

            this.show(disableAnim)
            div.css('z-index', 50 + newParentPage.currentOverlays.length)
            newParentPage.currentOverlays.push(this)
            this.parentPage = newParentPage
            this.currentLink = link

            // Change URL
            if (undefined != this.overlayRedirectTargetPage)
            {
                viewer.refresh_url(this)
            } else
            {
                var extURL = 'o=' + link.index
                viewer.refresh_url(newParentPage, extURL)
            }


        } else if (Constants.TRIGGER_ON_CLICK == this.overlayByEvent && posX == this.currentX && posY == this.currentY)
        {//handle only mouse hover
            // cursor returned back from overlay to hotspot -> nothing to do
        } else
        {
            this.hide()
            viewer.refresh_url(newParentPage)
        }
    }

    loadImages(force = false)
    {
        /// check if already loaded images for this page
        if (!force && this.imageObj != undefined)
        {
            return pagerMarkImageAsLoaded()
        }

        const enableLinks = true
        var isModal = this.type === "modal";

        var content = $('#content')
        var cssStyle = "height: " + this.height + "px; width: " + this.width + "px;"
        if (this.overlayShadow != undefined)
            cssStyle += "box-shadow:" + this.overlayShadow + ";"
        if ('overlay' == this.type && this.overlayOverFixed)
            cssStyle += "z-index: 50;"
        var imageDiv = $('<div>', {
            class: ('overlay' == this.type) ? "divPanel" : "image_div",
            id: "div_" + this.index,
            style: cssStyle
        });
        this.imageDiv = imageDiv


        // create fixed panel images        
        for (var panel of this.fixedPanels)
        {
            const isBottomFloat = panel.isFloat && !panel.constrains.top && panel.constrains.bottom

            let style = "'"
            let cssClass = ""

            if (panel.isVertScroll)
            {
                cssClass = "panelVSCroll divPanel"
                switch (panel.vst)
                {
                    case Constants.LAYER_VSCROLL_ALWAYS:
                        cssClass += " always"; break
                    case Constants.LAYER_VSCROLL_NEVER:
                        cssClass += " never"; break
                }
                style = `height: ${panel.mskH}px; width: ${panel.width}px; `
                style += "margin-left:" + panel.x + "px;"
                style += "top:" + panel.y + "px;"
            } else
            {
                style = "height: " + panel.height + "px; width: " + panel.width + "px; "

                if (panel.constrains.top || panel.isFixedisVertScrollDiv || (!panel.constrains.top && !panel.constrains.bottom))
                {
                    style += "top:" + panel.y + "px;"
                } else if (panel.constrains.bottom)
                {
                    style += "bottom:" + (this.height - panel.y - panel.height) + "px;"
                }
                if (panel.constrains.left || panel.isVertScroll || (!panel.constrains.left && !panel.constrains.right))
                {
                    style += "margin-left:" + panel.x + "px;"
                } else if (panel.constrains.right)
                {
                    style += "margin-left:" + panel.x + "px;"
                }
                //

                if (panel.shadow != undefined)
                    style += "box-shadow:" + panel.shadow + ";"

                // create Div for fixed panel            
                if (isBottomFloat)
                {
                    cssClass = 'fixedBottomPanelFloat'
                } else if (panel.isFloat)
                {
                    cssClass = 'fixedPanelFloat'
                } else if (panel.isVertScroll)
                {
                    cssClass = 'divPanel'
                } else if ("top" == panel.type)
                {
                    cssClass = 'fixedPanel fixedPanelTop'
                } else if ("left" == panel.type)
                {
                    cssClass = 'fixedPanel'
                }
            }

            var divID = panel.divID != '' ? panel.divID : ("fixed_" + this.index + "_" + panel.index)

            var panelDiv = $("<div>", {
                id: divID,
                class: cssClass,
                style: style
            })
            if (isBottomFloat)
            {
                const wrap1 = $("<div>", {
                    style: `position: absolute; z-index:13;`
                })
                const wrap2 = $("<div>", {
                    style: `position: fixed; height:100vh; max-height: ${this.height}px; top:0px;`
                })
                panelDiv.appendTo(wrap2);
                wrap2.appendTo(wrap1)
                wrap1.appendTo(imageDiv)
            } else
            {
                panelDiv.appendTo(imageDiv);
            }
            panel.imageDiv = panelDiv

            // create link div
            panel.linksDiv = $("<div>", {
                class: "linksDiv",
                style: "height: " + panel.height + "px; width: " + panel.width + "px;"
            })
            panel.linksDiv.appendTo(panel.imageDiv)
            this._createLinks(panel)

            // add image itself
            panel.imageObj = this._loadSingleImage(panel.isFloat || panel.isVertScroll ? panel : this, 'img_' + panel.index + "_")
            panel.imageObj.appendTo(panelDiv);
            if (!this.isDefault) panel.imageObj.css("webkit-transform", "translate3d(0,0,0)")
        }

        // create main content image      
        {
            var isModal = this.type === "modal";
            var contentModal = $('#content-modal');
            imageDiv.appendTo(isModal ? contentModal : content);

            // create link div
            if (enableLinks)
            {
                var linksDiv = $("<div>", {
                    id: "div_links_" + this.index,
                    class: "linksDiv",
                    style: "height: " + this.height + "px; width: " + this.width + "px;"
                })
                linksDiv.appendTo(imageDiv)
                this.linksDiv = linksDiv

                this._createLinks(this)
            }
        }
        var img = this._loadSingleImage(this, 'img_')
        this.imageObj = img
        img.appendTo(imageDiv)
    }

    showLayout()
    {
        if (undefined == this.layoutCreated)
        {
            this.layoutCreated = true
            this._addLayoutLines(this.imageDiv)
        }
    }

    _addLayoutLines(imageDiv)
    {
        if (this.type != "regular" || undefined == this.layout) return

        var x = this.layout.offset
        var colWidth = this.layout.columnWidth
        var colWidthInt = Math.round(this.layout.columnWidth)
        var gutterWidth = this.layout.gutterWidth
        for (var i = 0; i < this.layout.numberOfColumns; i++)
        {
            var style = "left: " + Math.trunc(x) + "px; top:" + 0 + "px; width: " + colWidthInt + "px; height:" + this.height + "px; "
            var colDiv = $("<div>", {
                class: "layoutColDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv)
            x += colWidth + gutterWidth
        }

        for (var y = 0; y < this.height; y += 5)
        {
            var style = "left: " + 0 + "px; top:" + y + "px; width: " + this.width + "px; height:" + 1 + "px; "
            var colDiv = $("<div>", {
                class: "layoutRowDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv)
        }
    }


    /*------------------------------- INTERNAL METHODS -----------------------------*/

    // Try to find a first page and link which has a link to this page
    _getSrcPageAndLink()
    {
        let res = null
        for (var page of story.pages)
        {
            res = this._getLinkByTargetPage(page, page.links, this.index)
            if (res) return res
            for (var panel of page.fixedPanels)
            {
                res = this._getLinkByTargetPage(page, panel.links, this.index)
                if (res) return res
            }
        }
        return null
    }

    _getLinkByTargetPage(page, links, targetPageIndex)
    {
        const link = links.find(link => link.page == targetPageIndex)
        if (!link) return null
        return {
            link: link,
            page: page
        }
    }



    _getLinkByIndex(index)
    {
        var link = this._getLinkByIndexInLinks(index, this.links)
        if (link != null) return link
        for (var panel of this.fixedPanels)
        {
            link = this._getLinkByIndexInLinks(index, panel.links)
            if (link != null) return link
        }
        return null
    }

    _getLinkByIndexInLinks(index, links)
    {
        var found = links.find(function (el)
        {
            return el.index == index
        })
        return found != undefined ? found : null
    }


    _loadSingleImage(sizeSrc, idPrefix)
    {
        var hasRetinaImages = story.hasRetina
        var imageURI = hasRetinaImages && viewer.isHighDensityDisplay() ? sizeSrc.image2x : sizeSrc.image;
        var unCachePostfix = "V_V_V" == story.docVersion ? "" : ("?" + story.docVersion)

        var img = $('<img/>', {
            id: idPrefix + this.index,
            class: "pageImage",
            src: encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI) + unCachePostfix,
        }).attr('width', sizeSrc.width).attr('height', sizeSrc.height);

        img.preload(function (perc, done)
        {
            //console.log(perc, done);
        });
        return img;
    }

    // panel: ref to panel or this
    _createLinks(panel)
    {
        var linksDiv = panel.linksDiv

        for (var link of panel.links)
        {
            link.panel = panel
            //
            let x = link.rect.x + (link.isParentFixed ? panel.x : 0)
            let y = link.rect.y + (link.isParentFixed ? panel.y : 0)

            var a = $("<a>", {
                lpi: this.index,
                li: link.index,
                lppi: "fixedPanels" in panel ? -1 : panel.index,
                lpx: x,
                lpy: y
            })

            var eventType = Constants.TRIGGER_ON_CLICK

            if ('page' in link)
            {
                var destPageIndex = viewer.getPageIndex(parseInt(link.page))
                var destPage = story.pages[destPageIndex];
                //
                if (link.triggerOnHover)
                {
                    eventType = Constants.TRIGGER_ON_HOVER
                    destPage.overlayByEvent = Constants.TRIGGER_ON_HOVER
                } else if ('overlay' == destPage.type)
                {
                    eventType = destPage.overlayByEvent
                }
            }

            if (EVENT_HOVER == eventType)
            { // for Mouse over event
                a.mouseenter(handleLinkEvent)
                if (
                    0 == destPage.overlayPin // ARTBOARD_OVERLAY_PIN_HOTSPOT
                    && 3 == destPage.overlayPinHotspot // ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT
                )
                {
                } else
                {
                    // need to pass click event to overlayed layers
                    a.click(function (e)
                    {
                        if (undefined == e.originalEvent) return
                        var nextObjects = document.elementsFromPoint(e.originalEvent.x, e.originalEvent.y);
                        for (var i = 0; i < nextObjects.length; i++)
                        {
                            var obj = nextObjects[i].parentElement
                            if (!obj || obj.nodeName != 'A' || obj == this) continue
                            $(obj).trigger('click', e);
                            return
                        }
                    })
                }
            } else
            { // for On click event
                a.click(handleLinkEvent)
            }

            a.appendTo(linksDiv)

            link.a = a

            var style = "left: " + link.rect.x + "px; top:" + link.rect.y + "px; width: " + link.rect.width + "px; height:" + link.rect.height + "px; "
            var linkDiv = $("<div>", {
                class: (EVENT_HOVER == eventType ? "linkHoverDiv" : "linkDiv") + (story.disableHotspots ? "" : " linkDivHighlight"),
            }).attr('style', style)
            linkDiv.appendTo(a)

            link.div = linkDiv

        }
    }
}

//
// customData:
//  x,y,pageIndex
function handleLinkEvent(event)
{
    var customData = viewer["customEvent"]

    if (viewer.linksDisabled) return false

    let currentPage = viewer.currentPage
    let orgPage = customData ? story.pages[customData.pageIndex] : story.pages[$(this).attr("lpi")]

    const linkIndex = customData ? customData.linkIndex : $(this).attr("li")
    const link = orgPage._getLinkByIndex(linkIndex)

    if (link.page != undefined)
    {
        var destPageIndex = parseInt(link.page)
        var linkParentFixed = "overlay" != orgPage.type ? link.isParentFixed : orgPage.inFixedPanel


        // title = story.pages[link.page].title;                   
        var destPage = story.pages[destPageIndex]
        if (!destPage) return


        if (('overlay' == destPage.type || 'modal' == destPage.type) && destPage.overlayRedirectTargetPage != undefined)
        {

            // Change base page
            viewer.goTo(destPage.overlayRedirectTargetPage, false, link)
            currentPage = viewer.currentPage
            orgPage = viewer.currentPage
        }

        if ('overlay' == destPage.type)
        {

            var orgLink = {
                orgPage: orgPage,
                index: linkIndex,
                fixedPanelIndex: parseInt($(this).attr("lppi")),
                this: $(this),
                x: customData ? customData.x : parseInt($(this).attr("lpx")),
                y: customData ? customData.y : parseInt($(this).attr("lpy")),
                width: link.rect.width,
                height: link.rect.height,
            }
            if(orgLink.fixedPanelIndex >= 0){
                orgLink.panel = currentPage.fixedPanels[orgLink.fixedPanelIndex]
            }

            // check if link in fixed panel aligned to bottom
            if (linkParentFixed && destPage.overlayAlsoFixed && orgLink.fixedPanelIndex >= 0 && currentPage.fixedPanels[orgLink.fixedPanelIndex].constrains.bottom && !currentPage.fixedPanels[orgLink.fixedPanelIndex].constrains.top)
            {
                orgLink.fixedBottomPanel = currentPage.fixedPanels[orgLink.fixedPanelIndex]
            } else
            { // clicked not from fixed panel           
                const pinHotspot = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT == destPage.overlayPin
                const pinPage = Constants.ARTBOARD_OVERLAY_PIN_PAGE == destPage.overlayPin

                var pageX = 0
                var pageY = 0

                if (pinHotspot)
                {
                    //////////////////////////////// PIN TO HOTSPOT ////////////////////////////////
                    // clicked from some other overlay
                    if ('overlay' == orgPage.type)
                    {
                        orgLink.x += orgPage.currentX
                        orgLink.y += orgPage.currentY
                    }
                    pageX = orgLink.x
                    pageY = orgLink.y

                    var offsetX = pinHotspot
                        && (
                            Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_LEFT == destPage.overlayPinHotspot
                            || Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_CENTER == destPage.overlayPinHotspot
                            || Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_RIGHT == destPage.overlayPinHotspot
                        )
                        ? 5 : 0

                    if (destPage.overlayClosePrevOverlay && ('overlay' == orgPage.type))
                    {
                        pageX = orgPage.currentX
                        pageY = orgPage.currentY
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_LEFT == destPage.overlayPinHotspot)
                    {
                        pageY += link.rect.height
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_CENTER == destPage.overlayPinHotspot)
                    {
                        pageX += parseInt(orgLink.width / 2) - parseInt(destPage.width / 2)
                        pageY += link.rect.height
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_RIGHT == destPage.overlayPinHotspot)
                    {
                        pageX += orgLink.width - destPage.width
                        pageY += link.rect.height
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT == destPage.overlayPinHotspot)
                    {
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_CENTER == destPage.overlayPinHotspot)
                    {
                        pageX += parseInt(orgLink.width / 2) - parseInt(destPage.width / 2)
                        //pageY -= destPage.height                            
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_RIGHT == destPage.overlayPinHotspot)
                    {
                        pageX += orgLink.width - destPage.width
                        //pageY = pageY - destPage.height                            
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_BOTTOM_RIGHT == destPage.overlayPinHotspot)
                    {
                        pageX += orgLink.width
                    } else if (pinHotspot && Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UP_CENTER == destPage.overlayPinHotspot)
                    {
                        pageX += parseInt(orgLink.width / 2) - parseInt(destPage.width / 2)
                        pageY -= destPage.height
                    } else
                    {
                        const srcLink = orgPage.links[orgLink.index]
                        if (srcLink && srcLink.pageOverlayPinHotspot === Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_RELATIVE)
                        {
                            pageX += srcLink.pageOverlayPinHotspotX
                            pageY += srcLink.pageOverlayPinHotspotY

                        }
                    }

                    // check page right side
                    if (!pinHotspot || (Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT != destPage.overlayPinHotspot))
                    {
                        const fullWidth = destPage.width + offsetX // + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0)
                        if ((pageX + fullWidth) > currentPage.width)
                            pageX = currentPage.width - fullWidth

                        /*if(linkPosX < (offsetX + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0))){  
                            linkPosX = offsetX + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0)
                        }*/
                    }
                } else
                {
                    //////////////////////////////// PIN TO PAGE ////////////////////////////////

                    if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_LEFT == destPage.overlayPinPage)
                    {
                        pageX = 0
                        pageY = 0
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_CENTER == destPage.overlayPinPage)
                    {
                        pageX = parseInt(currentPage.width / 2) - parseInt(destPage.width / 2)
                        pageY = 0
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_RIGHT == destPage.overlayPinPage)
                    {
                        pageX = currentPage.width - destPage.width
                        pageY = 0
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_CENTER == destPage.overlayPinPage)
                    {
                        pageX = parseInt(currentPage.width / 2) - parseInt(destPage.width / 2)
                        pageY = parseInt(currentPage.height / 2) - parseInt(destPage.height / 2)
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_LEFT == destPage.overlayPinPage)
                    {
                        pageX = 0
                        pageY = currentPage.height - destPage.height
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_CENTER == destPage.overlayPinPage)
                    {
                        pageX = parseInt(currentPage.width / 2) - parseInt(destPage.width / 2)
                        pageY = currentPage.height - destPage.height
                    } else if (pinPage && Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_RIGHT == destPage.overlayPinPage)
                    {
                        pageX = currentPage.width - destPage.width
                        pageY = currentPage.height - destPage.height
                    }

                }

                if (pageX < 0) pageX = 0
                if (pageY < 0) pageY = 0
            }

            if (destPage.visible)
            {
                const sameLink = destPage.currentLink.index == orgLink.index
                if (sameLink)
                {
                    destPage.hide()
                } else
                {
                    destPage.hide(false, true) // hide without transition animation
                    if (orgPage != destPage)
                        destPage.showAsOverlayInCurrentPage(orgPage, orgLink, pageX, pageY, linkParentFixed, true)
                }
                return false
            }
            destPage.showAsOverlayInCurrentPage(orgPage, orgLink, pageX, pageY, linkParentFixed)
            return false
        } else
        {
            // close modal if some link inside a modal opens the same modal
            if (destPageIndex == currentPage.index && currentPage.isModal)
            {
                viewer.closeModal()
                return false
            }

            // check if we need to close current overlay
            currentPage.hideCurrentOverlays()

            viewer.goTo(parseInt(destPageIndex), true, link)
            return false
        }
    } else if (link.action != null && link.action == 'back')
    {
        //title = "Go Back";
        viewer.currentPage.hideCurrentOverlays()
        viewer.goBack()
        return false
    } else if (link.url != null)
    {
        //title = link.url;
        viewer.currentPage.hideCurrentOverlays()
        var target = event.metaKey ? "_blank" : link.target
        window.open(link.url, target != undefined ? target : "_self")
        return false
        //document.location = link_url
        //target = link.target!=null?link.target:null;		
    }

    // close last current overlay if it still has parent
    if ('overlay' == orgPage.type && undefined != orgPage.parentPage)
    {
        orgPage.hide()
    }

    return false
}
