const ELEMENTINSPECTOR_LINUX_FONT_SIZES = {
    "8px": "6px",
    "10px": "7px",
    "11px": "8px",
    "12px": "9px",
    "13px": "10px",
    "15px": "11px",
    "16px": "12px",
    "17px": "13px",
    "19px": "14px",
    "20px": "15px",
    "21px": "16px",
    "23px": "17px",
    "24px": "18px",
    "25px": "19px",
    "26px": "20px"
}

const SUPPORT_TYPES = ["Text", "ShapePath", "Image", "Icon"]

class SymbolViewer extends AbstractViewer {
    constructor() {
        super()
        this.createdPages = {}
        //this.symbolIDs = {} // layer indexes ( in pages[].layers ) of symbols
        this.currentLib = ""
        this.selected = null
        this.showSymbols = false
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // populate library select
        const libSelect = $('#symbol_viewer #lib_selector')
        libSelect.append($('<option>', {
            value: "",
            text: 'Library autoselection'
        }));
        for (const libName of Object.keys(SYMBOLS_DICT)) {
            libSelect.append($('<option>', {
                value: libName,
                text: libName
            }));
        }
        libSelect.change(function () {
            var libName = $(this).children("option:selected").val();
            viewer.symbolViewer._selectLib(libName)

        })
        //
        const symCheck = $('#symbol_viewer_symbols')
        symCheck.click(function () {
            viewer.symbolViewer._setSymCheck($(this).is(':checked'))

        })

        this.inited = true
    }

    _setSymCheck(showSymbols) {
        this.showSymbols = showSymbols
        $('#lib_selector').toggle()
        this._reShowContent()

    }

    // called by Viewer
    pageChanged() {
        this._reShowContent()
    }

    _selectLib(libName) {
        this.currentLib = libName
        this._reShowContent()
    }

    _reShowContent() {
        delete this.createdPages[viewer.currentPage.index]

        // remove existing symbol links        
        this.page.linksDiv.children(".modalSymbolLink,.symbolLink").remove()
        for (const panel of this.page.fixedPanels) {
            panel.linksDiv.children(".modalSymbolLink,.symbolLink").remove()
        }

        // drop selection
        this.setSelected()

        // rebuild links
        this._buildElementLinks()

        // redraw inspector
        this._showEmptyContent()

    }


    toggle() {
        return this.visible ? this.hide() : this.show()
    }



    _hideSelf() {
        var isModal = viewer.currentPage && viewer.currentPage.isModal
        if (isModal) {
            $(".modalSymbolLink").remove()
            delete this.createdPages[viewer.currentPage.index]
        }
        const contentDiv = isModal ? $('#content-modal') : $('#content')
        contentDiv.removeClass("contentSymbolsVisible")

        viewer.linksDisabled = false
        $('#symbol_viewer').addClass("hidden")

        this.setSelected(null, null, null)

        super._hideSelf()
    }

    onContentClick() {
        this.setSelected(null)
        return true
    }

    handleKeyDown(jevent) {

        const event = jevent.originalEvent

        if (77 == event.which) { // m
            // Key "M" eactivates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (77 == event.which) { // m
            // Key "M" activates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }

    _showSelf() {
        if (!this.inited) this.initialize()

        viewer.toggleLinks(false)
        viewer.toogleLayout(false)
        viewer.linksDisabled = true

        this._buildElementLinks()

        var isModal = viewer.currentPage && viewer.currentPage.isModal
        const contentDiv = isModal ? $('#content-modal') : $('#content')
        contentDiv.addClass("contentSymbolsVisible")

        this._showEmptyContent()

        $('#symbol_viewer').removeClass("hidden")

        super._showSelf()

    }

    _showEmptyContent() {
        $("#symbol_viewer_content").html("")
        $('#symbol_viewer #empty').removeClass("hidden")
    }


    _buildElementLinks() {
        this._buildElementLinksForPage(viewer.currentPage)
        for (let overlay of viewer.currentPage.currentOverlays) {
            this._buildElementLinksForPage(overlay)
        }
    }


    _buildElementLinksForPage(page) {
        var pageIndex = page.index
        this.pageIndex = pageIndex
        this.page = page
        if (!(pageIndex in this.createdPages)) {
            const newPageInfo = {
                layerArray: [],
                siLayerIndexes: {}
            }
            // cache only standalone pages
            this.createdPages[pageIndex] = newPageInfo

            this.pageInfo = newPageInfo
        } else {
            this.pageInfo = this.createdPages[pageIndex]
        }
        //
        const layers = layersData[this.pageIndex].c
        if (undefined != layers) {
            if (this.showSymbols)
                this._processSymbolList(layers)
            else
                this._processLayerList(layers)
        }
    }

    _processSymbolList(layers, isParentSymbol = false) {
        for (var l of layers.slice().reverse()) {
            // l.b: library name
            if (
                l.s &&
                ("" == this.currentLib || (this.currentLib != "" && l.b && l.b == this.currentLib))
            ) {
                this._showElement(l)
            }/* else
                // l.s: symbol name
                // l.l: style name
                if (l.s != undefined || (!isParentSymbol && l.l != undefined)) {
                    this._showElement(l)
                }
            */
            // l.c : childs
            if (undefined != l.c)
                this._processSymbolList(l.c, l.s != undefined)
        }
    }

    _processLayerList(layers, sSI = null) {
        for (var l of layers.slice().reverse()) {
            if (SUPPORT_TYPES.indexOf(l.tp) >= 0 && !l.hd) {
                this._showElement(l, sSI)
            }
            if (undefined != l.c)
                this._processLayerList(l.c, "SI" == l.tp ? l : sSI)
        }
    }

    _showElement(l, siLayer = null) {
        if (l.hd) return

        var currentPanel = this.page
        l.finalX = l.x
        l.finalY = l.y

        for (const panel of this.page.fixedPanels) {
            if (l.x >= panel.x && l.y >= panel.y &&
                ((l.x + l.w) <= (panel.x + panel.width)) && ((l.y + l.h) <= (panel.y + panel.height))
            ) {
                l.finalX = l.x - panel.x
                l.finalY = l.y - panel.y
                currentPanel = panel
                break
            }
        }
        l.parentPanel = currentPanel


        // Check if some layer on top of current
        for (const pl of this.pageInfo.layerArray.filter(s => s.tp != "SI")) {
            if (pl.finalX <= l.finalX && pl.finalY <= l.finalY && (pl.finalX + pl.w) >= (l.finalX + l.w) && (pl.finalY + pl.h) >= (l.finalY + l.h)) return
        }

        // Check if layer is empty
        if ("Text" == l.tp) {
            if ("" == l.tx.trim()) return
        }

        // also push symbol instance to a list of layers (if was not aded before)        
        let indexOfSO = -1
        if (siLayer) {
            if (siLayer.s in this.pageInfo.siLayerIndexes) {
                indexOfSO = this.pageInfo.siLayerIndexes[siLayer.s]
            } else {
                indexOfSO = this.pageInfo.layerArray.length
                this.pageInfo.layerArray.push(siLayer)
            }
        }
        //

        l.infoIndex = this.pageInfo.layerArray.length
        this.pageInfo.layerArray.push(l)

        var a = $("<a>", {
            class: viewer.currentPage.isModal ? "modalSymbolLink" : "symbolLink",
            pi: this.pageIndex,
            li: l.infoIndex,
            si: indexOfSO
        })

        a.click(function (event) {
            const sv = viewer.symbolViewer
            const pageIndex = $(this).attr("pi")
            const layerIndex = $(this).attr("li")
            const siLayerIndex = $(this).attr("si")
            const pageInfo = sv.createdPages[pageIndex]
            let topLayer = pageInfo.layerArray[layerIndex]
            const siLayer = siLayerIndex >= 0 ? pageInfo.layerArray[siLayerIndex] : null

            sv.setSelected(event, topLayer, $(this))
            if (!sv.selected) {
                return false
            }
            const layer = sv.selected.layer // selection can be changed inside setSelected

            var symName = layer.s ? layer.s : (siLayer ? siLayer.s : null)
            //sv.showSymbols && layer.s ? layer.s : (siLayer ? siLayer.s : null)
            var styleName = layer.l

            const styleInfo = styleName != undefined ? viewer.symbolViewer._findStyleAndLibByStyleName(styleName) : undefined
            const symInfo = symName != undefined ? viewer.symbolViewer._findSymbolAndLibBySymbolName(symName) : undefined

            var info = ""
            // layer.b : shared library name, owner of style or symbol
            // layer.s : symbol name
            // layer.l : style name
            // layer.tp : layer type: SI, Text, ShapePath or Image
            // siLayer : symbol master, owner of the layer            

            info += sv._showLayerDimensions(layer)
            info += sv._showLayerIcon(layer)
            if ("Icon" != layer.tp) info += sv._showLayerSymbol(layer, symName, siLayer)
            info += sv._showLayerComment(layer)
            info += sv._showLayerStyle(layer, siLayer)

            // if layer has CSS classes described
            if (layer.pr != undefined) {
                let tokens = null
                if (styleInfo)
                    tokens = styleInfo.style.tokens
                if (symInfo) {
                    const foundLayer = symInfo.symbol.layers[layer.n]
                    if (foundLayer) {
                        if (null == tokens)
                            tokens = foundLayer.tokens
                        else
                            tokens = sv._mergeTokens(tokens, foundLayer.tokens)
                    }
                }
                const decRes = sv._decorateCSS(layer, tokens, layer.b ? layer : siLayer)
                info += decRes.css

                if ("Text" == layer.tp) {
                    info += sv._showLayerTextContent(layer, decRes)
                }
            }

            // Process image layar
            if ("Image" == layer.tp) {
                info += sv._showLayerImage(layer)
            }

            $('#symbol_viewer #empty').addClass("hidden")
            $("#symbol_viewer_content").html(info)
            $("#symbol_viewer_content").removeClass("hidden")

            //alert(info)
            return false
        })

        a.prependTo(currentPanel.linksDiv)

        var style = "left: " + l.finalX + "px; top:" + l.finalY + "px; "
        style += "width: " + l.w + "px; height:" + l.h + "px; "
        var symbolDiv = $("<div>", {
            class: "symbolDiv",
        }).attr('style', style)
        symbolDiv.mouseenter(function () {
            viewer.symbolViewer.mouseEnterLayerDiv($(this))
        })

        symbolDiv.appendTo(a)
    }

    _mergeTokens(list1, list2) {
        let adding = []
        list2.forEach(function (t2) {
            const res1 = list1.filter(t1 => t1[0] == t2[0])
            if (!res1.length) adding.push(t2)
        })
        if (adding.length)
            return list1.concat(adding)
        else
            return list1
    }

    // Show Text layer content with Copy button
    _showLayerTextContent(layer, decRes) {
        if (layer.tx == undefined || layer.tx == "") return ""
        let info = ""

        info += `
                <hr>
                <div class='block'>
                <div class='label'>Text Content&nbsp;<button onclick = "copyToBuffer('sv_content')">Copy</button>`
        let afterContent = ""
        let cssClass = ""
        if (decRes.styles["font-family"].startsWith("Font Awesome 5")) {
            cssClass += "icon "
            if (decRes.styles["font-weight"] != "400") cssClass += "solid "
            const codeText = layer.tx.codePointAt(0).toString(16)
            afterContent = "Unicode: " + codeText
            info += `<button onclick = "showFAIconInfo('` + codeText + `')">Info</button>`
        } else {
            cssClass += "code value"
        }
        info += `</div ><div id='sv_content' class="` + cssClass + `">` + layer.tx + "</div>"
        if (afterContent != "") {
            info += "<div  class='code value'>" + afterContent + "</div>"
        }
        info += "</div>"

        return info
    }

    _showLayerSymbol(layer, symName, siLayer) {
        if (undefined == symName) return ""
        let info = "<hr>" +
            "<div class='block'>" +
            "<div class='label'>" + "Symbol" + "</div>" +
            "<div class='value'>" + symName + "</div>"
        const libName = layer.b != undefined ? (layer.b + " (external)") :
            (siLayer && siLayer.b ? siLayer.b + " (external)" : "Document")
        info += "<div style='font-size:12px; color:var(--color-secondary)'>" + libName + "</div></div>"
        return info
    }

    _showLayerIcon(layer) {
        if (undefined == layer.icn) return ""
        let info = `<hr>
            <div class='block'>
                <div class='label'>Icon</div>
                <div class='value'>${layer.icn}</div>
            </div>
            `
        return info
    }


    _showLayerComment(layer) {
        var comment = layer.comment
        if (undefined == comment) return ""

        return `
                <hr>
                <div class="block">
                    <div class="label">Comment</div>
                    <div style="value">${comment}</div>
                </div>`
    }

    _showLayerImage(layer) {
        let info = ""
        const url = layer.iu
        info += `
                <hr>
                <div class='block'>
                <div class='label'>Image Content&nbsp;<a class="svlink" href="`+ url + `">Download</a>`
        let cssClass = "code value"
        const width = "100%" //viewer.defSidebarWidth - 40
        info += `</div ><div id='sv_content' class="` + cssClass + `"><img ` + `width="` + width + `" src="` + url + `"/></div>`
        return info
    }

    // siLayer: parent symbol 
    _showLayerStyle(layer, siLayer) {
        if (undefined == layer.l) return ""

        let info = ""
        let styleName = layer.l
        const libName = layer.b != undefined ? (layer.b + " (external)") :
            (siLayer ? siLayer.b + " (external)" : "Document")

        info = `<hr>
                <div class='block'>
                    <div class='label'>Layer Style</div>
                    <div class='value'>${styleName}</div>
                    <div style='font-size:12px; color:var(--color-secondary)'>${libName}</div>
                </div>`

        return info
    }

    _showLayerDimensions(layer) {
        let info = ""

        var frameX = layer.finalX
        var frameY = layer.finalY
        var frameWidth = layer.w
        var frameHeight = layer.h

        info += "<hr>" +
            "<div class='block twoColumn'>" +
            "<div>" +
            "<span class='label'>" + "X: </span>" + Math.round(frameX) + "px" +
            "</div>" +
            "<div>" +
            "<span class='label'>" + "Y: </span>" + Math.round(frameY) + "px" +
            "</div>" +
            "</div>"

        info += "<div class='block twoColumn'>" +
            "<div>" +
            "<span class='label'>" + "Width: </span>" + Math.round(frameWidth) + "px" +
            "</div>" +
            "<div>" +
            "<span class='label'>" + "Height: </span>" + Math.round(frameHeight) + "px" +
            "</div>" +
            "</div>"
        return info
    }

    setSelected(event = null, layer = null, a = null, force = false) {
        const prevClickedLayer = this.lastClickedLayer
        this.lastClickedLayer = layer
        //
        const click = event ? {
            x: event.offsetX * viewer.currentZoom + layer.finalX,
            y: event.offsetY * viewer.currentZoom + layer.finalY
        } : {}
        let foundLayers = []
        this.findOtherSelection(click, null, foundLayers)
        // reset previous selection                
        if (this.selected) {
            if (!force && event && layer) {
                if (foundLayers.length > 1) {
                    let newIndex = undefined
                    if (undefined != prevClickedLayer && layer.ii != prevClickedLayer.ii) {
                        // clicked on an other layer, find its index
                        newIndex = foundLayers.indexOf(layer)
                    } else if (undefined != this.selectedLayerIndex) {
                        // clicked on the some layer, but 
                        // we have several overlaped objects under a cursor, so switch to the next 
                        newIndex = (this.selectedLayerIndex + 1) >= foundLayers.length ? 0 : this.selectedLayerIndex + 1
                    } else {
                        newIndex = foundLayers.indexOf(layer)
                    }
                    layer = foundLayers[newIndex]
                    this.selectedLayerIndex = newIndex
                }
            }
            this.selected.marginDivs.forEach(d => d.remove())
            this.selected.borderDivs.forEach(d => d.remove())
        } else {
            this.selectedLayerIndex = foundLayers.indexOf(layer)
        }

        if (!layer) {
            this.selected = null
            this.lastClickedLayer = undefined
            this.selectedLayerIndex = undefined
            ////
            $('#symbol_viewer #empty').removeClass("hidden")
            $("#symbol_viewer_content").addClass("hidden")
            ////
            return
        }
        // select new
        this.selected = {
            layer: layer,
            a: $(this),
            marginDivs: [],
            borderDivs: [],
        }
        // draw left vertical border
        this.selected.borderDivs.push(
            this._drawMarginLine(layer.parentPanel, layer.finalX, 0, 1, layer.parentPanel.height, "svBorderLineDiv")
        )
        // draw right vertical border
        this.selected.borderDivs.push(
            this._drawMarginLine(layer.parentPanel, layer.finalX + layer.w, 0, 1, layer.parentPanel.height, "svBorderLineDiv")
        )
        // draw top horizonal border
        this.selected.borderDivs.push(
            this._drawMarginLine(layer.parentPanel, 0, layer.finalY, layer.parentPanel.width, 1, "svBorderLineDiv")
        )
        // draw bottom horizonal border
        this.selected.borderDivs.push(
            this._drawMarginLine(layer.parentPanel, 0, layer.finalY + layer.h, layer.parentPanel.width, 1, "svBorderLineDiv")
        )
    }

    findOtherSelection(click, layers, foundLayers) {
        if (null == layers) layers = layersData[this.pageIndex].c

        if (undefined == layers) return
        for (var l of layers.slice().reverse()) {
            if ((!this.showSymbols || l.s != undefined) &&
                SUPPORT_TYPES.indexOf(l.tp) >= 0 && !l.hd) {
                if (click.x >= l.finalX && click.x <= (l.finalX + l.w) && click.y >= l.finalY && click.y <= (l.finalY + l.h)) {
                    foundLayers.push(l)
                }
            }
            if (undefined != l.c)
                this.findOtherSelection(click, l.c, foundLayers)
        }
    }


    mouseEnterLayerDiv(div) {
        // get a layer under mouse 
        const a = div.parent()
        const sv = viewer.symbolViewer
        const pageIndex = a.attr("pi")
        const layerIndex = a.attr("li")
        const layer = sv.createdPages[pageIndex].layerArray[layerIndex]
        if (!layer) return
        // get a currently selected layer
        if (!sv.selected) return
        const slayer = sv.selected.layer
        //
        if (!slayer || !layer) return
        // check if layers are in the same panel
        if (slayer.parentPanel != layer.parentPanel) return
        // remove previous margins
        this.selected.marginDivs.forEach(d => d.remove())
        this.selected.marginDivs = []
        // show margins
        this._drawTopVMargin(slayer.parentPanel, layer, slayer)
        this._drawBottomVMargin(slayer.parentPanel, layer, slayer)
        this._drawLeftHMargin(slayer.parentPanel, layer, slayer)
        this._drawRightHMargin(slayer.parentPanel, layer, slayer)
    }

    _drawLeftHMargin(currentPanel, layer, slayer) {
        let hmargin = 0
        let x = null
        if (layer.finalX == slayer.finalX) {
        } else if ((slayer.finalX + slayer.w) < layer.finalX) {
            // if layer bottom over slayer top => don't show top margin
        } else if ((layer.finalX + layer.w) < slayer.finalX) {
            // layer bottom over slayer.top
            x = layer.finalX + layer.w
            hmargin = slayer.finalX - x
        } else if (layer.finalX < slayer.finalX) {
            // layer top over slayer.top
            x = layer.finalX
            hmargin = slayer.finalX - x
        } else {
            // layer top over slayer.top
            x = slayer.finalX
            hmargin = layer.finalX - x
        }

        if (hmargin > 0) {
            let y = this._findLayersCenterY(layer, slayer)
            this.selected.marginDivs.push(this._drawMarginLine(currentPanel, x, y, hmargin, 1, "svMarginLineDiv"))
            this.selected.marginDivs.push(this._drawMarginValue(currentPanel, x + hmargin / 2, y, hmargin, "svMarginLineDiv"))
        }
    }


    _drawRightHMargin(currentPanel, layer, slayer) {
        let hmargin = 0
        let x = null

        const layerRight = layer.finalX + layer.w
        const slayerRight = slayer.finalX + slayer.w

        if (layerRight == slayerRight) {
        } else if (layerRight < slayer.finalX) {
            // if layer bottom over slayer bottom => don't show bottom margin                
        } else if (slayerRight < layer.finalX) {
            // slayer bottom over layer.top
            x = slayerRight
            hmargin = layer.finalX - x
        } else if (slayerRight < layerRight) {
            // slayer bottom over layer.bottom
            x = slayerRight
            hmargin = layerRight - x
        } else {
            // slayer bottom over layer.bottom
            x = layerRight
            hmargin = slayerRight - x
        }

        if (hmargin > 0) {
            let y = this._findLayersCenterY(layer, slayer)
            this.selected.marginDivs.push(this._drawMarginLine(currentPanel, x, y, hmargin, 1, "svMarginLineDiv"))
            this.selected.marginDivs.push(this._drawMarginValue(currentPanel, x + hmargin / 2, y, hmargin, "svMarginLineDiv"))
        }
    }


    _drawTopVMargin(currentPanel, layer, slayer) {
        let vmargin = 0
        let y = null
        if (layer.finalY == slayer.finalY) {
        } else if ((slayer.finalY + slayer.h) < layer.finalY) {
            // if layer bottom over slayer top => don't show top margin
        } else if ((layer.finalY + layer.h) < slayer.finalY) {
            // layer bottom over slayer.top
            y = layer.finalY + layer.h
            vmargin = slayer.finalY - y
        } else if (layer.finalY < slayer.finalY) {
            // layer top over slayer.top
            y = layer.finalY
            vmargin = slayer.finalY - y
        } else {
            // layer top over slayer.top
            y = slayer.finalY
            vmargin = layer.finalY - y
        }

        if (vmargin > 0) {
            let x = this._findLayersCenterX(layer, slayer)
            this.selected.marginDivs.push(this._drawMarginLine(currentPanel, x, y, 1, vmargin, "svMarginLineDiv"))
            this.selected.marginDivs.push(this._drawMarginValue(currentPanel, x, y + vmargin / 2, vmargin, "svMarginLineDiv"))
        }
    }

    _drawBottomVMargin(currentPanel, layer, slayer) {
        let vmargin = 0
        let y = null

        const layerBottom = layer.finalY + layer.h
        const slayerBottom = slayer.finalY + slayer.h

        if (layerBottom == slayerBottom) {
        } else if (layerBottom < slayer.finalY) {
            // if layer bottom over slayer bottom => don't show bottom margin        
        } else if (slayerBottom < layer.finalY) {
            // slayer bottom over layer.top
            y = slayerBottom
            vmargin = layer.finalY - y
        } else if (slayerBottom < layerBottom) {
            // slayer bottom over layer.bottom
            y = slayerBottom
            vmargin = layerBottom - y
        } else {
            // slayer bottom over layer.bottom
            y = layerBottom
            vmargin = slayerBottom - y
        }

        if (vmargin > 0) {
            let x = this._findLayersCenterX(layer, slayer)
            this.selected.marginDivs.push(this._drawMarginLine(currentPanel, x, y, 1, vmargin, "svMarginLineDiv"))
            this.selected.marginDivs.push(this._drawMarginValue(currentPanel, x, y + vmargin / 2, vmargin, "svMarginLineDiv"))
        }
    }


    _findLayersCenterX(l, sl) {
        let c = l.finalX + l.w / 2
        let sc = sl.finalX + sl.w / 2
        return sl.finalX > l.finalX && ((sl.finalX + sl.w) < (l.finalX + l.w)) ? sc : c
    }

    _findLayersCenterY(l, sl) {
        let c = l.finalY + l.h / 2
        let sc = sl.finalY + sl.h / 2
        return sl.finalY > l.finalY && ((sl.finalY + sl.h) < (l.finalY + l.h)) ? sc : c
    }

    _drawMarginLine(currentPanel, x, y, width, height, className) {
        var style = "left: " + x + "px; top:" + y + "px; "
        style += "width: " + width + "px; height:" + height + "px; "
        var div = $("<div>", { class: className }).attr('style', style)
        div.appendTo(currentPanel.linksDiv)
        return div
    }
    _drawMarginValue(currentPanel, x, y, value) {
        const valueHeight = 20
        const valueWidth = 30
        var style = "left: " + (x - valueWidth / 2) + "px; top:" + (y - valueHeight / 2) + "px; "
        //style += "width: " + valueWidth + "px; height:" + valueHeight + "px; "
        var div = $("<div>", {
            class: "svMarginValueDiv",
        }).attr('style', style)
        //
        div.html(" " + Number.parseFloat(value).toFixed(0) + " ")
        //
        div.appendTo(currentPanel.linksDiv)
        return div
    }

    _decorateCSS(layer, tokens, siLayer) {
        let css = layer.pr
        let result = ""
        let styles = {}

        result += "<hr>" +
            "<div class='block'>" +
            "<div class='label'>CSS Styles" +
            (1 == story.fontSizeFormat ? " (font size adjusted for Linux)" : "") +
            "</div > " +
            "<div class='value code'>"

        // Decorate styles already described in CSS 
        css.split("\n").forEach(line => {
            if ("" == line) return
            const props = line.split(": ", 2)
            if (!props.length) return
            const styleName = props[0]
            const styleValue = props[1].slice(0, -1)

            result += this._decorateCSSOneStyle(tokens, layer, siLayer, styleName, styleValue)
            styles[styleName] = styleValue

        }, this);
        // Decorate non-CSS common styles
        result += this._decorateCSSOtherTokens(tokens, layer, siLayer)


        result += "</div></div>"
        return { "css": result, "styles": styles }
    }


    _decorateCSSOneStyle(tokens, layer, siLayer, styleName, styleValue) {
        let result = ""
        result += "" + styleName + ": "
        result += "<span class='tokenName'>"
        //
        let cvTokens = null
        if (layer.cv && "color" == styleName) {
            // get token for color variable
            cvTokens = this._findSwatchTokens(layer.cv)
            if (cvTokens) {
                const tokenStr = this._decorateSwatchToken(cvTokens, styleValue)
                result += tokenStr != "" ? tokenStr : (styleValue + ";")
            }
        }
        if (null == cvTokens) {
            const tokenStr = tokens != null ? this._decorateStyleToken(styleName, tokens, siLayer, styleValue) : ""
            result += tokenStr != "" ? tokenStr : (this._formatStyleValue(styleName, styleValue) + ";")
        }
        //
        result += "</span>"
        result += "<br/>"
        return result
    }

    _decorateCSSOtherTokens(tokens, layer, siLayer) {
        if (null == tokens) return ""
        let result = ""
        const knownOtherStyles = ["width", "height"]
        tokens.filter(t => knownOtherStyles.indexOf(t[0]) >= 0 || t[0].startsWith("margin") || t[0].startsWith("padding")).forEach(function (token) {
            result += this._decorateCSSOneStyle(tokens, layer, siLayer, token[0], token[1])
        }, this)
        return result
    }

    _decorateSwatchToken(tokens, styleValue) {
        const tokenName = tokens[0][1]
        //
        return tokenName + ";</span><span class='tokenValue'>//" + styleValue
    }

    _decorateStyleToken(style, tokens, siLayer, styleValue) {
        // search tokan name by style name 
        const foundTokens = tokens.filter(t => t[0] == style)
        if (!foundTokens.length) return ""
        const tokenName = foundTokens[foundTokens.length - 1][1]
        //
        const libName = undefined != siLayer.b ? siLayer.b : story.docName
        const finalTokenInfo = this._findTokenValueByName(tokenName, libName, styleValue)
        //
        if (finalTokenInfo)
            return finalTokenInfo[0] + ";</span><span class='tokenValue'>//" + this._formatStyleValue(style, finalTokenInfo[1])
        else
            return ""
    }

    _formatStyleValue(style = "font-size", styleValue = "13px") {
        if ("font-size" == style && 1 == story.fontSizeFormat) {
            if (styleValue in ELEMENTINSPECTOR_LINUX_FONT_SIZES) {
                styleValue = ELEMENTINSPECTOR_LINUX_FONT_SIZES[styleValue]
            } else {
                styleValue = Math.round(Number(styleValue.replace("px", "")) / 1.333) + "px"
            }
        }
        return styleValue
    }


    _showTextPropery(propName, propValue, postfix = "") {
        let text = propName + ": " + propValue + postfix + ";"
        return text + "<br/>"
    }

    // result: undefined or [tokenName,tokenValue]
    _findTokenValueByName(tokenName, libName, styleValue = null) {
        const lib = TOKENS_DICT[libName]
        if (undefined == lib) return undefined
        let value = lib[tokenName]
        if (value != undefined || null == styleValue) return [tokenName, lib[tokenName]]

        ///// try to find a token with a similar name
        // cut magic postfix to get a string for search
        const pos = tokenName.indexOf("--token")
        if (pos < 0) return undefined
        styleValue = styleValue.toLowerCase()
        const newName = tokenName.slice(0, pos)
        // filter lib tokens by name and value
        const similarTokens = Object.keys(lib).filter(function (n) {
            return n.startsWith(newName) && lib[n].toLowerCase() == styleValue
        }, this)
        if (!similarTokens.length) return undefined
        //
        return [
            similarTokens[0],
            lib[similarTokens[0]]
        ]
    }

    _findSymbolAndLibBySymbolName(symName) {
        for (const libName of Object.keys(SYMBOLS_DICT)) {
            const lib = SYMBOLS_DICT[libName]
            if (!(symName in lib)) continue
            return {
                lib: lib,
                libName: libName,
                symbol: lib[symName]
            }
        }
        return undefined
    }

    _findStyleAndLibByStyleName(styleName) {
        for (const libName of Object.keys(SYMBOLS_DICT)) {
            const lib = SYMBOLS_DICT[libName]
            if (!("styles" in lib) || !(styleName in lib.styles)) continue
            return {
                lib: lib,
                libName: libName,
                style: lib.styles[styleName]
            }
        }
        return undefined
    }

    // cv:{
    //   sn: swatch name
    //   ln:  lib name
    // }
    _findSwatchTokens(cv) {
        const lib = SYMBOLS_DICT[cv.ln]
        if (!lib) {
            console.log("Can not find lib " + cv.ln)
            return null
        }
        //
        const swatch = lib.colors__[cv.sn]
        if (!swatch) {
            console.log("Can not find color name " + cv.sn)
            return null
        }

        return swatch
    }
}
