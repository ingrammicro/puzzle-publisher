@import("constants.js")
@import("lib/utils.js")
@import("exporter/PZLayer.js")
@import("exporter/PZDoc.js")

Sketch = require('sketch/dom')



class PZArtboard extends PZLayer {

    constructor(slayer) {
        if (DEBUG) exporter.logMsg("PZArtboard.create id=" + slayer.name)

        // init Artboard own things !!! before object construction !!!
        let artboardType = exporter.Settings.layerSettingForKey(slayer, SettingKeys.ARTBOARD_TYPE)
        if (undefined == artboardType || '' == artboardType) {
            if (exporter.Settings.layerSettingForKey(slayer, SettingKeys.LEGACY_ARTBOARD_MODAL) == 1) {
                artboardType = Constants.ARTBOARD_TYPE_MODAL // use legacy setting
            } else
                artboardType = Constants.ARTBOARD_TYPE_REGULAR // set default 0 value
        }
        let externalArtboardURL =
            exporter.Settings.layerSettingForKey(slayer, SettingKeys.LAYER_EXTERNAL_LINK)
        if (externalArtboardURL != undefined && ('' == externalArtboardURL || 'http://' == externalArtboardURL))
            externalArtboardURL = undefined


        // Resize before exporting
        const needResize = exporter.customArtboardFrame && Constants.ARTBOARD_TYPE_REGULAR == artboardType && undefined == externalArtboardURL
        if (needResize) {
            if (exporter.customArtboardFrame.width > 0)
                slayer.frame.width = exporter.customArtboardFrame.width
            if (exporter.customArtboardFrame.height > 0)
                slayer.frame.height = exporter.customArtboardFrame.height
        }

        super(slayer, undefined)

        this.overlayLayers = []
        this.fixedLayers = [] // list of layers which are configured as fixed
        this.nextLinkIndex = 0 // we need it to generate uniq id of the every link
        this.imageLayers = [] // list of all Image childs

        // check if the page name is unique in document
        if (this.name in pzDoc.artboardsDict) {
            // we need to find a new name                        
            for (let i = 1; i < 1000; i++) {
                const newName = this.name + "(" + i + ")"
                if (!(newName in pzDoc.artboardsDict)) {
                    // found new unique name!
                    this.name = newName
                    break
                }
            }
        }
        // init Artboard own things
        this.artboardType = artboardType
        this.isModal = Constants.ARTBOARD_TYPE_MODAL == this.artboardType
        this.externalArtboardURL = externalArtboardURL

        this.showShadow = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_SHADOW)
        if (undefined != this.showShadow)
            this.showShadow = this.showShadow == 1
        else {
            const legacyShadow = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LEGACY_ARTBOARD_MODAL_SHADOW)
            if (undefined != legacyShadow && Constants.ARTBOARD_TYPE_MODAL == this.artboardType) {
                this.showShadow = legacyShadow
            } else {
                this.showShadow = true
            }
        }

        this.overlayOverFixed = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED) == 1
        {
            var overlayAlsoFixed = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED)
            this.overlayAlsoFixed = overlayAlsoFixed != undefined ? overlayAlsoFixed : true
        }
        this.overlayClosePrevOverlay = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_CLOSE_PREVOVERLAY) == 1

        this.disableAutoScroll =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL)
        this.transNextSecs =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
        if (undefined != this.transNextSecs && '' == this.transNextSecs)
            this.transNextSecs = undefined

        this.transAnimType = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_TRANS_ANIM_TYPE)
        if (undefined == this.transAnimType)
            this.transAnimType = Constants.ARTBOARD_TYPE_OVERLAY == this.artboardType ?
                Constants.ARTBOARD_TRANS_ANIM_FADE :
                Constants.ARTBOARD_TRANS_ANIM_NONE
        if (Constants.ARTBOARD_TRANS_ANIM_NONE != this.transAnimType) {
            exporter.enableTransitionAnimation = true
        }

        this.overlayByEvent = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_BY_EVENT)
        if (this.overlayByEvent == undefined || this.overlayByEvent == "") this.overlayByEvent = 0

        this.oldOverlayAlign = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.OLD_ARTBOARD_OVERLAY_ALIGN)
        if (this.oldOverlayAlign == undefined || this.oldOverlayAlign == "") this.oldOverlayAlign = 0

        this.overlayPin = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_PIN)
        if (this.overlayPin == undefined) {
            const newValues = Utils.upgradeArtboardOverlayPosition(this.oldOverlayAlign)
            this.overlayPin = newValues.pinTo
            this.overlayPinHotspot = newValues.hotspotTo
            this.overlayPinPage = newValues.pageTo
        } else {
            this.overlayPinHotspot = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_PIN_HOTSPOT)
            this.overlayPinPage = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_PIN_PAGE)
        }

    }

    collectLayers(space) {
        //if(DEBUG) exporter.logMsg(space+"PZArtboard.collectLayers() name="+this.name)
        this.childs = this.collectAChilds(this.slayer.layers, space + " ")
    }

    export() {
        this._exportImages()
        this._findFixedPanelHotspots()
        //this._exportOverlayLayers()
        this._pushIntoStoryData(this.index)
    }

    //------------------- FIND HOTSPOTS WHICH LOCATE OVER FIXED HOTPOSTS ----------------------------
    //------------------- AND MOVE THEM INTO FIXED LAYER SPECIAL HOTSPOTS ---------------------------
    _findFixedPanelHotspots() {
        for (var l of this.fixedLayers) {
            for (let hIndex = 0; hIndex < this.hotspots.length; hIndex++) {
                let hotspot = this.hotspots[hIndex]
                // move hotspot from artboard hotspots to fixed layer hotspots
                if (hotspot.r.insideRectangle(l.frame)) {
                    this.hotspots.splice(hIndex--, 1)
                    hotspot.r.x -= l.frame.x
                    hotspot.r.y -= l.frame.y
                    l.hotspots.push(hotspot)
                }
            }

        }
    }

    //------------------ GENERATE STORY.JS FILE  ------------------
    _pushIntoStoryData(pageIndex) {
        const mainName = this.name

        if (DEBUG) exporter.logMsg("process main artboard " + mainName);
        pzDoc.totalImages++

        let data = {}

        data['id'] = this.objectID
        data['groupID'] = String(this.slayer.parent.id)
        data['index'] = pageIndex
        data['image'] = Utils.toFilename(mainName + '.' + exporter.fileType, false)
        if (exporter.retinaImages)
            data['image2x'] = Utils.toFilename(mainName + '@2x.' + exporter.fileType, false)

        data['width'] = this.frame.width
        data['height'] = this.frame.height
        data['x'] = this.frame.x
        data['y'] = this.frame.y
        data['title'] = mainName

        if (this.transNextSecs != undefined) {
            data['transNextMsecs'] = parseFloat(this.transNextSecs) * 1000
        }

        data['transAnimType'] = this.transAnimType

        if (this.disableAutoScroll) {
            data['disableAutoScroll'] = true
        }

        {
            var layoutGrid = this.nlayer.layout() // class: MSLayoutGrid
            if (!layoutGrid) layoutGrid = MSDefaultLayoutGrid.defaultLayout();
            if (layoutGrid) {
                var grid = {
                    offset: layoutGrid.horizontalOffset(),
                    totalWidth: layoutGrid.totalWidth(),
                    numberOfColumns: layoutGrid.numberOfColumns(),
                    columnWidth: layoutGrid.columnWidth(),
                    gutterWidth: layoutGrid.gutterWidth()
                }
                data['layout'] = grid
            }
        }

        if (this.isModal) {
            data['type'] = 'modal'
            data['isModal'] = true
            data['showShadow'] = this.showShadow ? 1 : 0
        } else if (this.externalArtboardURL != undefined && this.externalArtboardURL != '') {
            data['type'] = 'external'
        } else if (Constants.ARTBOARD_TYPE_OVERLAY == this.artboardType) {
            data['type'] = 'overlay'
            // try to find a shadow
            if (this.showShadow) {
                const layerWithShadow = this._getOverlayShadowLayer()
                if (layerWithShadow) {
                    const shadowInfo = layerWithShadow.getShadowAsStyle()
                    data['overlayShadow'] = shadowInfo.style
                    data['overlayShadowX'] = shadowInfo.x
                }
            } else if ((Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT == this.overlayPin) && (Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT == this.overlayPinHotspot)) {
                const layerWithShadow = this._getOverlayShadowLayer()
                if (layerWithShadow) {
                    const shadowInfo = layerWithShadow.getShadowAsStyle()
                    data['overlayShadowX'] = shadowInfo.x
                }
            }
            data['overlayByEvent'] = this.overlayByEvent
            data['overlayPin'] = this.overlayPin
            data['overlayPinHotspot'] = this.overlayPinHotspot
            data['overlayPinPage'] = this.overlayPinPage
            data['overlayOverFixed'] = !!this.overlayOverFixed
            data['overlayAlsoFixed'] = !!this.overlayAlsoFixed
            data['overlayClosePrevOverlay'] = !!this.overlayClosePrevOverlay
        } else {
            data['type'] = 'regular'
        }

        // add fixed layers
        data['fixedPanels'] = this._getFixedLayersForJSON()

        // add hotspots 
        data['links'] = this._buildHotspots(this.hotspots)

        if (this.overlayRedirectTargetPage != undefined)
            data['overlayRedirectTargetPage'] = this.overlayRedirectTargetPage

        let js = pageIndex ? ',' : '';
        js += "$.extend(new ViewerPage()," + JSON.stringify(data, null, ' ') + ")\n"

        exporter.storyData.pages.push(data)
    }


    _getOverlayShadowLayer() {
        return this._findLayersShadow(this.childs)
    }

    _findLayersShadow(layers) {
        for (var l of layers) {
            let layerWithShadow = this._findLayerShadow(l)
            if (layerWithShadow) return layerWithShadow
        }
        return undefined
    }

    _findLayerShadow(l) {
        let shadowsStyle = l.getShadowAsStyle()
        if (shadowsStyle !== undefined) return l

        return this._findLayersShadow(l.childs)
    }

    clearRefsBeforeJSON() {
        super.clearRefsBeforeJSON()
        this.overlayLayers = undefined
        this.fixedLayers = undefined
        this.imageLayers = undefined
    }


    addLayerAsExportableImage(layer) {
        layer.imageIndex = this.imageLayers.length
        this.imageLayers.push(layer)
        if (DEBUG) exporter.logMsg("Add image layer: " + layer.name)
    }

    _getFixedLayersForJSON() {
        let recs = []

        if (this.fixedLayers.length) {
            const mainName = this.name
            const foundPanels = []
            for (var l of this.fixedLayers) {
                let type = l.fixedType
                if (type == "") {
                    exporter.logError("pushFixedLayersIntoJSStory: can't understand fixed panel type for artboard '" + this.name
                        + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    continue
                }
                pzDoc.totalImages++

                if (!l.isFloat && foundPanels[type]) {
                    exporter.logError("pushFixedLayersIntoJSStory: found more than one panel with type '" + type + "' for artboard '"
                        + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    const existedPanelLayer = foundPanels[type]
                    exporter.logError("pushFixedLayersIntoJSStory: already exists panel layer='" + existedPanelLayer.name
                        + "' layer.frame=" + existedPanelLayer.frame)
                    continue
                }
                foundPanels[type] = l

                const fileNamePostfix = !(l.isFloat || l.isFixedDiv) ? "" : ('-' + l.fixedIndex)


                const rec = {
                    constrains: l.constrains,
                    x: l.frame.x,
                    y: l.frame.y,
                    width: l.frame.width,
                    height: l.frame.height,
                    type: type,
                    index: l.fixedIndex,
                    isFloat: l.isFloat,
                    isFixedDiv: l.isFixedDiv,
                    divID: l.layerDivID != undefined ? l.layerDivID : "",
                    links: this._buildHotspots(l.hotspots, true),
                    image: Utils.quoteString(Utils.toFilename(mainName, false) + fileNamePostfix + '.' + exporter.fileType)
                }
                if (exporter.retinaImages)
                    rec.image2x = Utils.quoteString(Utils.toFilename(mainName, false) + fileNamePostfix + '@2x.' + exporter.fileType, false)

                // setup shadow
                const layerWithShadow = this._findLayerShadow(l)
                if (layerWithShadow) {
                    const shadowsStyle = layerWithShadow.getShadowAsStyle()
                    rec.shadow = shadowsStyle.style
                    rec.shadowX = shadowsStyle.x
                }
                recs.push(rec)
            }
        }

        return recs
    }



    _buildHotspots(srcHotspots, isParentFixed = false) {
        let newHotspots = []
        for (var hotspot of srcHotspots) {
            const newHotspot = {
                rect: hotspot.r,
                isParentFixed: isParentFixed,
            }


            if (hotspot.linkType == 'back') {
                newHotspot.action = 'back'
            } else if (hotspot.linkType == 'artboard' && pzDoc.artboardsDict[hotspot.artboardID] != undefined
                && pzDoc.artboardIDsDict[hotspot.artboardID].externalArtboardURL != undefined
            ) {
                newHotspot.url = pzDoc.artboardIDsDict[hotspot.artboardID].externalArtboardURL
            } else if (hotspot.linkType == 'artboard') {
                const targetPage = pzDoc.artboardIDsDict[hotspot.artboardID]
                if (targetPage == undefined) {
                    if (DEBUG) exporter.logMsg("undefined artboard: '" + hotspot.artboardName + '"');
                    continue
                }
                const targetPageIndex = targetPage.index;
                newHotspot.page = targetPageIndex
            } else if (hotspot.linkType == 'href') {
                newHotspot.url = hotspot.href
            } else if (hotspot.target != undefined) {
                newHotspot.target = hotspot.target
            } else {
                if (DEBUG) exporter.logMsg("_pushHotspotIntoJSStory: Uknown hotspot link type: '" + hotspot.linkType + "'")
            }

            if (hotspot.target != undefined) {
                newHotspot.target = hotspot.target
            }

            if (hotspot.overlayRedirect && newHotspot.page != undefined) {
                this.overlayRedirectTargetPage = newHotspot.page
            }

            newHotspot.index = this.nextLinkIndex++
            newHotspots.push(newHotspot)

        }
        return newHotspots
    }


    //------------------ GENERATE IMAGES  ------------------


    _getImageName(scale, injectScaleToName = true, panelPostix = "") {
        const suffix = injectScaleToName && scale == 2 ? "@2x" : "";
        return Utils.toFilename(this.name, false) + panelPostix + suffix + "." + exporter.fileType;
    }

    // exportType:  full, layer, preview, artboard
    _exportImage(exportType, nlayer = null, panelPostix = "") {
        nlayer = nlayer || this.nlayer
        if (DEBUG) exporter.logMsg("   exportImage() for " + nlayer.name())

        let scales = null
        let imageBasePath = exporter.imagesPath
        let injectScaleToName = true

        if ('artboard' == exportType || 'layer' == exportType) {
            scales = exporter.retinaImages ? [1, 2] : [1]
        } else if ('full' == exportType) {
            scales = [2]
            imageBasePath = exporter.fullImagesPath
            injectScaleToName = false
        } else if ('preview' == exportType) {
            scales = [522 / nlayer.frame().width()]
            imageBasePath = exporter.previewsImagePath
            injectScaleToName = false
        }

        for (let scale of scales) {
            const imageName = this._getImageName(scale, injectScaleToName, panelPostix)
            const imagePath = imageBasePath + imageName
            let slice = null

            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
            slice.scale = scale;
            slice.saveForWeb = false;
            slice.format = exporter.fileType;
            exporter.ndoc.saveArtboardOrSlice_toFile(slice, imagePath);
        }
    }

    // new experimental code to export images
    // we don't use it because it doesn't allow to set a file name
    _exportImage2(scales, slayer) {
        if (DEBUG) exporter.logMsg("exportImage()");

        const imagePath = exporter.imagesPath // + this._getImageName(scales)
        exporter.logMsg('_exportImage2 name=' + slayer.name)
        const options = {
            scales: scales,
            output: exporter.imagesPath,
            overwriting: true,
            'save-for-web': true,
            formats: exporter.fileType
        }
        Sketch.export(slayer, options)

    }

    _exportImages() {

        //this._getAllLayersMatchingPredicate(Sketch.getSelectedDocument().sketchObject)

        if (DEBUG) exporter.logMsg("PZArtboard._exportImages: running... " + this.name)
        let scales = exporter.retinaImages ? [1, 2] : [1]

        // export fixed panels to their own image files
        this._exportFixedLayersToImages(scales)

        // hide fixed panels to generate a main page content without fixed panels 
        // and their artefacts (shadows)
        this._hideFixedLayers(true)

        this._exportImage("artboard")

        // export images for Element Inspector
        if (exporter.enabledJSON) {
            this._exportImageLayers()
        }

        // show fixed panels back
        // ! temporary disabled because an exported image still shows hidden layers
        this._hideFixedLayers(false)

        if (exporter.exportFullImages) {
            // export full image        
            if (DEBUG) exporter.logMsg("PZArtboard._exportImages: export full image")
            this._exportImage("full")
        }

        // export preview images (to use by Gallery and Inspector Viewer)        
        this._exportImage("preview")

        if (DEBUG) exporter.logMsg("PZArtboard._exportImages: done!")
    }


    _exportOverlayLayers() {
        if (DEBUG) exporter.logMsg('_exportOverlayLayers: running')
        let scales = exporter.retinaImages ? [1, 2] : [1]
        for (const layer of this.overlayLayers) {
            // log('_exportOverlayLayers: '+layer.name)               
            // need 
            const artboard = this._findArtboardByName(layer.name + "@")
            if (!artboard) continue
            //
            this._exportImage("layer", artboard.sketchObject, "-" + layer.name)
            //
        }
        if (DEBUG) exporter.logMsg('_exportOverlayLayers: done!')
    }

    _exportImageLayers() {
        if (DEBUG) exporter.logMsg('_exportImageLayers: running')
        for (var layer of this.imageLayers) {
            const path = exporter._outputPath + "/" + layer._buildImageURL()
            if (DEBUG) exporter.logMsg(path)
            if ("Image" == layer.slayer.type) {
                // The folowing code source — https://stackoverflow.com/a/17510651/9384835
                let image = layer.slayer.image.nsimage
                let cgRef = [image CGImageForProposedRect: nil context: nil hints: nil]
                let newRep = [[NSBitmapImageRep alloc] initWithCGImage: cgRef]
                [newRep setSize: [image size]];
                let pngData = [newRep representationUsingType: NSPNGFileType properties: nil];
                [pngData writeToFile: path atomically: true];
                [newRep autorelease];
            } else if ("Group" == layer.slayer.type) {
                if (DEBUG) exporter.logMsg("Export group")
                const slice = MSExportRequest.exportRequestsFromExportableLayer(layer.nlayer).firstObject();
                slice.scale = 2
                slice.saveForWeb = false
                slice.format = exporter.fileType
                exporter.ndoc.saveArtboardOrSlice_toFile(slice, path)
            }
        }
        if (DEBUG) exporter.logMsg('_exportImageLayers: done')
    }


    _exportFixedLayersToImages(scales) {
        for (var layer of this.fixedLayers) {
            layer.calculateFixedType()

            // temporary disable fixed panel shadows
            let orgShadows = undefined
            let layerWithShadow = this._findLayerShadow(layer)
            if (layerWithShadow) {
                orgShadows = layerWithShadow.slayer.style.shadows
                layerWithShadow.slayer.style.shadows = []
            }

            // for div and  float fixed layer we need to generate its own image files
            if (layer.isFloat || layer.isFixedDiv) {
                //this._exportImage2('1, 2',layer.parent.slayer)         
                const l = layer.parent.isSymbolInstance ? layer : layer
                this._exportImage("layer", l.nlayer, "-" + layer.fixedIndex)
            }

            // restore original fixed panel shadows
            if (layerWithShadow) {
                layerWithShadow.slayer.style.shadows = orgShadows
            }
        }
    }

    _hideFixedLayers(hide) {
        const show = !hide
        for (var layer of this.fixedLayers) {
            // we need to hide/show only div and  float panels
            if (undefined == layer.slayer.style) continue
            if (layer.isFloat || layer.isFixedDiv) {
                layer.slayer.hidden = hide
            }

            // temporary remove fixed panel shadows
            if (hide) {
                layer.fixedShadows = layer.slayer.style.shadows
                layer.slayer.style.shadows = []
            }

            // restore original fixed panel shadows
            if (show) {
                layer.slayer.style.shadows = layer.fixedShadows
            }

            // Commented to make it worked in Sketch 65
            //Sketch.getSelectedDocument().sketchObject.documentData().invalidateAffectedSymbolInstancesWithDiff(layer.objectID)
        }

    }


}
