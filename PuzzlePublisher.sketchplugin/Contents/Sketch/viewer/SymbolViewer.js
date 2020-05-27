const TPROP_TEXT = "tt"
const TPROP_FONT_FAMILY = "tff"
const TPROP_FONT_SIZE = "tfs"
const TPROP_TEXT_COLOR = "ttc"
const TPROP_ALIGNMENT = "ta"
const TPROP_V_ALIGNMENT = "tva"
const TPROP_FONT_WEIGHT = "tfw"
const TPROP_FONT_STYLE = "tfst"
const TPROP_LINE_HEIGHT = "tlh"
const TPROP_TEXT_TRANSFORM = "ttf"
const TPROP_TEXT_UNDERLINE = "ttu"
const TPROP_TEXT_STRIKE_THROUGHT = "tst"
const TPROP_PARAGRAPH_SPACING = "tps"
const TPROP_KERNING = "tk"

//// ^^^^ copied from PZLayer:_initTextPropsForJSON()

class SymbolViewer extends AbstractViewer {
    constructor() {
        super()
        this.createdPages = {}
        //this.symbolIDs = {} // layer indexes ( in pages[].layers ) of symbols
        this.currentLib = ""
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

        // redraw inspector
        this._showEmptyContent()

        // rebuild links
        this._buildSymbolLinks()
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

        super._hideSelf()
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

        this._buildSymbolLinks()

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

    _buildSymbolLinks() {
        this._showPage(viewer.currentPage)
        for (let overlay of viewer.currentPage.currentOverlays) {
            this._showPage(overlay)
        }
    }


    _showPage(page) {
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
            this._create()
        } else {
            this.pageInfo = this.createdPages[pageIndex]
        }
    }



    _create() {
        const layers = layersData[this.pageIndex].c
        if (this.showSymbols)
            this._processSymbolList(layers)
        else
            this._processLayerList(layers)
    }

    _processSymbolList(layers, isParentSymbol = false) {
        for (var l of layers) {
            if (this.currentLib != "") {
                if (this.showSymbols && l.b) {
                    if (l.b == this.currentLib) {
                        this._showElement(l)
                        continue
                    }
                }
                if (!this.showSymbols && undefined != l.l) {
                    const styleInfo = this._findStyleAndLibByStyleName(l.l)
                    if (styleInfo && styleInfo.libName == this.currentLib) {
                        this._showElement(l)
                        continue
                    }
                }
            } else {
                if ((this.showSymbols && l.s != undefined) ||
                    (!this.showSymbols && !isParentSymbol && l.l != undefined)) {
                    this._showElement(l)
                }
            }
            this._processSymbolList(l.c, this.showSymbols && l.s != undefined)
        }
    }

    _processLayerList(layers, sSI = null) {
        const supportedTypes = ["Text", "ShapePath"]
        for (var l of layers) {
            if (supportedTypes.indexOf(l.tp) >= 0) {
                this._showElement(l, sSI)
            } else {
                if ("SI" == l.tp) sSI = l
                this._processLayerList(l.c, sSI)
            }
        }
    }

    _showElement(l, siLayer = null) {

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

        const layerIndex = this.pageInfo.layerArray.length
        this.pageInfo.layerArray.push(l)

        var a = $("<a>", {
            class: viewer.currentPage.isModal ? "modalSymbolLink" : "symbolLink",
            pi: this.pageIndex,
            li: layerIndex,
            si: indexOfSO
        })

        a.click(function () {
            const sv = viewer.symbolViewer
            const pageIndex = $(this).attr("pi")
            const layerIndex = $(this).attr("li")
            const siLayerIndex = $(this).attr("si")
            const layer = sv.createdPages[pageIndex].layerArray[layerIndex]
            const siLayer = siLayerIndex >= 0 ? sv.createdPages[pageIndex].layerArray[siLayerIndex] : null

            var symName = sv.showSymbols ? layer.s : (siLayer ? siLayer.s : null)
            var styleName = layer.l
            var comment = layer.comment
            var frameX = layer.finalX
            var frameY = layer.finalY
            var frameWidth = layer.w
            var frameHeight = layer.h

            const styleInfo = styleName != undefined ? viewer.symbolViewer._findStyleAndLibByStyleName(styleName) : undefined
            const symInfo = symName != undefined ? viewer.symbolViewer._findSymbolAndLibBySymbolName(symName) : undefined


            var info = ""
            if (symName != undefined) {
                info = "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Symbol" + "</div>" +
                    "<div class='value'>" + symName + "</div>"
                const libName = layer.b != undefined ? (layer.b + " (external)") : (siLayer && siLayer.b ? siLayer.b : "Document")
                info += "<div style='font-size:12px; color:var(--color-secondary)'>" + libName + "</div></div>"

            }
            if (styleName != undefined) {
                info = "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Style" + "</div>" +
                    "<div class='value'>" + styleName + "</div>"
                const libName = layer.b != undefined ? (layer.b + " (external)") : (siLayer ? siLayer.b : "Document")
                info += "<div style='font-size:12px; color:var(--color-secondary)'>" + libName + "</div></div>"
            }


            if (comment != undefined) info +=
                "<hr>" +
                "<div class='block'>" +
                "<div class='label'>" + "Comment" + "</div>" +
                "<div style='value'>" + comment + "</div>" + 2
            "</div>"

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


            if (symInfo != undefined && siLayerIndex < 0) {
                info += "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Symbol layers and tokens" + "</div>" +
                    "<div class='value code'>"
                var layerCounter = 0
                for (const layerName of Object.keys(symInfo.symbol.layers)) {
                    if (layerCounter) info += "<br/>"
                    info += layerName + "<br/>"
                    info += sv._decorateTokens(symInfo.symbol.layers[layerName].tokens, layer)
                    layerCounter++
                }
                info += "</div></div>"
            }

            if (layer.tp != undefined) {
                if ("Text" == layer.tp) {
                    info += sv._decorateCSS(layer.pr, symInfo ? symInfo.symbol.layers[layer.n].tokens : null, siLayer)
                    if (layer.tx != undefined && layer.tx != "") {
                        info += "<hr>" +
                            "<div class='block'>" +
                            "<div class='label'>Content</div >" +
                            "<div class='value code'>"
                        info += layer.tx
                        info += "</div></div>"
                    }
                } else if ("ShapePath" == layer.tp) {
                    info += sv._decorateCSS(layer.pr, symInfo ? symInfo.symbol.layers[layer.n].tokens : null, siLayer)
                }
            }

            $('#symbol_viewer #empty').addClass("hidden")
            $("#symbol_viewer_content").html(info)
            //alert(info)
        })

        a.appendTo(currentPanel.linksDiv)

        var style = "left: " + l.finalX + "px; top:" + l.finalY + "px; "
        style += "width: " + l.w + "px; height:" + l.h + "px; "
        var symbolDiv = $("<div>", {
            class: "symbolDiv",
        }).attr('style', style)

        symbolDiv.appendTo(a)
    }

    _decorateCSS(css, tokens, siLayer) {
        let result = ""

        result += "<hr>" +
            "<div class='block'>" +
            "<div class='label'>Styles</div > " +
            "<div class='value code'>"

        css.split("\n").forEach(line => {
            if ("" == line) return
            const props = line.split(": ", 2)
            if (!props.length) return
            result += "" + props[0] + ": "
            result += "<span class='tokenName'>"
            //
            const tokenStr = tokens != null ? this._decorateStyleToken(props[0], tokens, siLayer) : ""
            result += tokenStr != "" ? tokenStr : props[1]
            //
            result += "</span>"
            result += "<br/>"
        }, this);

        result += "</div></div>"
        return result
    }

    _decorateStyleToken(style, tokens, siLayer) {
        // search tokan name by style name 
        const foundTokens = tokens.filter(t => t[0] == style)
        if (!foundTokens.length) return ""
        const tokenName = foundTokens[0][1]
        //
        const libName = undefined != siLayer.b ? siLayer.b : story.docName
        const tokenValue = this._findTokenValueByName(tokenName, libName)
        //
        return tokenName + "</span><span class='tokenValue'>//" + tokenValue
    }


    _showTextPropery(propName, propValue, postfix = "") {
        let text = propName + ": " + propValue + postfix + ";"
        return text + "<br/>"
    }

    _decorateTokens(tokens, layer) {
        let text = ""
        tokens.forEach(token => {
            const [tokenType, tokenName] = token
            text += "<span class='tokenName'>" + tokenName + ";</span>"
            const libName = undefined != layer.b ? layer.b : story.docName
            const tokenValue = this._findTokenValueByName(tokenName, libName)
            if (undefined != tokenValue) {
                text += "<span class='tokenValue'>//" + tokenValue + "</span>"
            }
            text += "<br/>"
        })
        return text
    }

    _findTokenValueByName(tokenName, libName) {
        const lib = TOKENS_DICT[libName]
        if (undefined == lib) return undefined
        return lib[tokenName]
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
}
