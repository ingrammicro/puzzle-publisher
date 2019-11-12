@import("constants.js")
@import("lib/utils.js")
@import("exporter/PZDoc.js")


var ResizingConstraint = {
    NONE: 0,
    RIGHT: 1 << 0,
    WIDTH: 1 << 1,
    LEFT: 1 << 2,
    BOTTOM: 1 << 3,
    HEIGHT: 1 << 4,
    TOP: 1 << 5
}

var UX1LibraryName = "ux1-ui"

var Sketch = require('sketch/dom')
var Flow = require('sketch/dom').Flow

class PZLayer {

    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(sLayer, myParent) {
        this.nlayer = sLayer.sketchObject
        this.name = sLayer.name
        this.parent = myParent
        this.objectID = String(sLayer.id)
        this.originalID = undefined
        this.slayer = sLayer
        this.artboard = myParent ? myParent.artboard : this
        this.isParentFixed = undefined != myParent && (myParent.isFixed || myParent.isParentFixed)


        // define type    
        this.isArtboard = false
        this.isGroup = false
        this.isSymbolInstance = false
        this.customLink = undefined
        this.isLink = false


        if ("Group" == sLayer.type || "Artboard" == sLayer.type) this.isGroup = true
        const targetPos = this.name.indexOf("±±")
        if (targetPos >= 0) {
            // This layer is Symbol instance
            const data = this.name.substring(targetPos + 2)
            const symbolIDPos = data.indexOf("±±")
            const targetID = data.substring(0, symbolIDPos)
            const symbolID = data.substring(symbolIDPos + 2)

            const sSymbolMaster = pzDoc.getSymbolMasterByID(symbolID)
            if (!sSymbolMaster) {
                log("PZLayer:constructor() can't find symbol master for layer=" + this.name)
            } else {
                this.isSymbolInstance = true
                this.targetId = targetID

                // prepare data for Element Inspector
                const lib = sSymbolMaster.getLibrary()
                if (lib) {
                    this.smName = sSymbolMaster.name + ""
                    this.smLib = lib.name
                }
            }
        } else {
            // Check layer shared styles
            this.smName = undefined

            // prepare data for Element Inspector            
            var sharedStyle = this.slayer.sharedStyle
            if (sharedStyle) {
                this.styleName = sharedStyle.name
            }
            if ("Text" == sLayer.type) {
                this.text = this.slayer.text + ""
            }

            this.targetId = this.slayer.flow ? this.slayer.flow.targetId : null
        }
        if ("Artboard" == sLayer.type) this.isArtboard = true

        if (!this.isArtboard) {
            pzDoc.mAllLayers.push(this)


            // Check if this layer has a link
            if (this.targetId) {
                this.isLink = true
            } else {
                const externalLinkHref = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_EXTERNAL_LINK)
                if (externalLinkHref != null && externalLinkHref != "" && externalLinkHref != "http://") {
                    this.externalLinkHref = externalLinkHref
                    this.isLink = true
                }
            }
            if (this.isLink) {
                pzDoc.mLinkedLayers.push(this)

            }

        }

        var comment = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_COMMENT)
        if (undefined != comment && '' != comment) {
            this.comment = comment
        }

        this.childs = []
        this.hotspots = []

        // Recalculate frame
        this.frame = Utils.copyRectToRectangle(this.nlayer.absoluteRect())
        if (!this.isArtboard) {
            this.frame.x -= this.artboard.frame.x
            this.frame.y -= this.artboard.frame.y
        }

        if (myParent != undefined) this.constrains = this._calculateConstrains()

        if (!this.isArtboard && !exporter.disableFixedLayers && !this.isParentFixed) {
            var overlayType = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_OVERLAY_TYPE)
            if (undefined == overlayType || '' == overlayType)
                overlayType = Constants.LAYER_OVERLAY_DEFAULT

            if (this.nlayer.isFixedToViewport() || overlayType != Constants.LAYER_OVERLAY_DEFAULT) {
                this.addSelfAsFixedLayerToArtboad(overlayType)
            }
        }

        // check special internal properties
        // check: if this layer provides browser window background color
        if ("" == exporter.backColor) {
            while (true) {
                if (this.name.indexOf(Constants.INT_LAYER_NAME_BACKCOLOR) < 0) break
                let fills = this.slayer.style.fills
                if (undefined == fills) break
                fills = fills.filter(function (el) { return el.enabled })
                if (0 == fills.length) break
                exporter.backColor = fills[0].color
                break
            }
        }
        // check: if this layer provides browser favicon
        if (this.name.indexOf(Constants.INT_LAYER_NAME_SITEICON) >= 0) {
            exporter.siteIconLayer = this
        }
        // check: if this layer contains special overlay
        if (!this.isArtboard && this.name.indexOf(Constants.INT_LAYER_NAME_OVERLAYONHOVER) >= 0) {
            this.hasHoverOverlay = true
            this.artboard.overlayLayers.push(this)
        }

    }

    _calculateConstrains() {
        const resizingConstraint = 63 ^ this.nlayer.resizingConstraint()
        const res = {
            top: (resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP,
            bottom: (resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM,
            left: (resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT,
            right: (resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT,
            height: (resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT,
            width: (resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH
        }
        return res
    }

    collectAChilds(sLayers, space) {
        var aLayers = []
        if (undefined == sLayers) {
            log(this)
            log("PZLayer:collectAChilds() empty sLayers. this.name=" + this.name)
        }
        for (const sl of sLayers) {
            const al = new PZLayer(sl, this)
            if (al.isGroup) al.childs = al.collectAChilds(sl.layers, space + " ")
            aLayers.push(al)
        }
        return aLayers
    }

    addSelfAsFixedLayerToArtboad(overlayType) {

        if (Constants.LAYER_OVERLAY_DIV == overlayType) {
            var layerDivID = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_DIV_ID)
            if (layerDivID != undefined && layerDivID != '') {
                this.layerDivID = layerDivID
            } else {
                // No Div ID = No div overlay
                return
            }
        }

        this.isFixed = true
        this.overlayType = overlayType
        this.fixedIndex = this.artboard.fixedLayers.length
        this.artboard.fixedLayers.push(this)
    }

    calculateFixedType() {
        let type = "";

        if (Constants.LAYER_OVERLAY_DIV == this.overlayType) {
            type = 'div'
        } else if (Constants.LAYER_OVERLAY_TRANSP_TOP == this.overlayType) {
            type = "top";
        } else if (Constants.LAYER_OVERLAY_TRANSP_LEFT == this.overlayType) {
            type = "left";
        } else
            type = "float"

        this.fixedType = type
        this.isFloat = type == 'float'
        this.isFixedDiv = type == 'div'

    }


    buildLinks(space) {
        this._processHotspots(space)
    }

    getShadowAsStyle() {
        if (this.slayer.style == undefined || this.slayer.style.shadows == undefined || this.slayer.style.length == 0) return undefined

        let shadowInfo = undefined
        for (var shadow of this.slayer.style.shadows) {
            if (!shadow.enabled) continue
            let shadowsStyle = ""

            if (shadowsStyle != "") shadowsStyle += ","
            shadowsStyle += shadow.x + "px "
            shadowsStyle += shadow.y + "px "
            shadowsStyle += shadow.blur + "px "
            shadowsStyle += shadow.spread + " "
            shadowsStyle += shadow.color + " "

            shadowInfo = {
                style: shadowsStyle,
                x: shadow.x + shadow.blur
            }
        }

        return shadowInfo
    }


    _processHotspots(prefix) {
        const l = this
        const hotspots = []

        let finalHotspot = {
            r: this.frame.copy(),
            //l: l,
            linkType: 'undefined',
            artboardID: null,
            target: null
        }

        if (this.hasHoverOverlay) {
            const hoverHotsport = {
                r: l.frame.copy(),
                linkType: 'artboard',
                artboardID: l.hoverOverlayArtboardID
            }
            this.artboard.hotspots.push(hoverHotsport)
        }

        while (true) {

            // check link to external URL
            if (this.externalLinkHref != null) {
                const externalLink = {
                    'href': this.externalLinkHref,
                    'openNewWindow': exporter.Settings.layerSettingForKey(l.slayer, SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN) == 1

                }
                if (!this._specifyExternalURLHotspot(prefix + " ", finalHotspot, externalLink)) return
                break
            }

            // check native link
            if (null != l.targetId) {
                if (!this._specifyHotspot(prefix + " ", l, finalHotspot)) return
                break
            }

            // No any link on layer
            return
        }
        hotspots.push(finalHotspot);

        // finalization
        Array.prototype.push.apply(this.artboard.hotspots, hotspots);

        exporter.logMsg(prefix + "_processLayerLinks")
    }


    _specifyHotspot(prefix, l, finalHotspot) {
        const targetArtboardID = l.targetId;

        if (targetArtboardID == 'back') {
            // hande Back action
            finalHotspot.linkType = "back";
            exporter.logMsg(prefix + "hotspot: back")
        } else if (targetArtboardID != null && targetArtboardID != "" && targetArtboardID != "null") {
            // hande direct link
            let targetArtboard = pzDoc.findArtboardByID(targetArtboardID)

            if (!targetArtboard) {
                exporter.logWarning("Broken link to missed artboard on layer '" + l.name + "' on artboard '" + l.artboard.name + "' target=")
                return false
            }

            if (targetArtboard.externalArtboardURL != undefined) {
                const externalLink = {
                    'href': targetArtboard.externalArtboardURL,
                    'openNewWindow': exporter.Settings.layerSettingForKey(targetArtboard.slayer, SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN) == 1
                }
                finalHotspot.artboardID = targetArtboard.objectID
                this._specifyExternalURLHotspot(prefix + " ", finalHotspot, externalLink)
            } else {
                finalHotspot.linkType = "artboard";
                finalHotspot.artboardID = targetArtboardID;
                finalHotspot.href = Utils.toFilename(targetArtboard.name) + ".html";
            }

        } else {
            return false
        }
        return true
    }

    _specifyExternalURLHotspot(prefix, finalHotspot, externalLink) {
        exporter.logMsg(prefix + "_specifyExternalURLHotspothotspot: href")
        // found external link
        const regExp = new RegExp("^http(s?)://");
        var href = externalLink.href
        if (!regExp.test(href.toLowerCase())) {
            href = "http://" + href;
        }
        const target = externalLink.openNewWindow ? "_blank" : null;

        finalHotspot.linkType = "href"
        finalHotspot.href = href
        finalHotspot.target = target

        return true
    }



    clearRefsBeforeJSON() {
        // need to cleanup temp object to allow dump it into JSON
        // but keep nlayer because Exporter.exportImage() needs it
        this.tempOverrides = undefined
        this.slayer = undefined
        //l.nlayer = undefined
        this.customLink = undefined

    }

    exportSiteIcon() {
        const nlayer = this.nlayer
        const layer = this

        const imageName = "icon.png"
        const imagePath = exporter._outputPath + "/resources/" + imageName;

        let slice = null

        slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();

        slice.scale = 1;
        slice.saveForWeb = false;
        slice.format = "png";
        exporter.ndoc.saveArtboardOrSlice_toFile(slice, imagePath);

        /*const options = { 
            scales: [1],
            output: imagePath,
            overwriting: true,
            'save-for-web': true, 
            formats: 'png' 
        }
        Sketch.export(this.slayer, options)       */
    }

}
