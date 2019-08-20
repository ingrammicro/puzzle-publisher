@import("constants.js")
@import("lib/utils.js")
@import("exporter/child-finder.js")
@import("exporter/my_layer.js")

Sketch = require('sketch/dom')

class MyArtboard extends MyLayer {

    static getArtboardGroupsInPage(page, context, includeNone = true) {
        const artboardsSrc = page.artboards();
        const artboards = [];

        artboardsSrc.forEach(function(artboard){
            if( !artboard.isKindOfClass(MSSymbolMaster)){
              artboards.push(artboard);
            }
        });
      
        return Utils.getArtboardGroups(artboards, context);  
      }
      

    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(nlayer) {

        // init Artboard own things !!! before object construction !!!
        let slayer = Sketch.fromNative(nlayer)
        let artboardType = exporter.Settings.layerSettingForKey(slayer, SettingKeys.ARTBOARD_TYPE)
        if(undefined == artboardType || '' == artboardType){
            if(exporter.Settings.layerSettingForKey(slayer, SettingKeys.LEGACY_ARTBOARD_MODAL)==1){
                artboardType = Constants.ARTBOARD_TYPE_MODAL // use legacy setting
            }else
                artboardType = Constants.ARTBOARD_TYPE_REGULAR // set default 0 value
        }
        let externalArtboardURL =
            exporter.Settings.layerSettingForKey(slayer, SettingKeys.LAYER_EXTERNAL_LINK)
        if(externalArtboardURL!=undefined && (''==externalArtboardURL || 'http://'==externalArtboardURL)) 
            externalArtboardURL = undefined


        // Resize before exporting
        const oldframe = slayer.frame.copy()
        const needResize = exporter.customArtboardFrame && Constants.ARTBOARD_TYPE_REGULAR == artboardType && undefined == externalArtboardURL
        if(needResize){            
            if(exporter.customArtboardFrame.width > 0 ) 
                slayer.frame.width = exporter.customArtboardFrame.width
            if(exporter.customArtboardFrame.height > 0)    
                slayer.frame.height = exporter.customArtboardFrame.height
        }

        super(nlayer, undefined)
        
        this.oldFrame = needResize?oldframe:undefined
        this.overlayLayers = []
        this.fixedLayers = [] // list of layers which are configured as fixed
        this.nextLinkIndex = 0 // we need it to generate uniq id of the every link

        // check if the page name is unique in document
        if(this.name in exporter.pagesDict){
            // we need to find a new name                        
            for(let i=1;i<1000;i++){               
                const newName = this.name+"("+i+")"
                if( !(newName in exporter.pagesDict)){
                    // found new unique name!
                    this.name = newName
                    break
                }
            }            
        }
        exporter.pagesDict[this.name] = this
        exporter.pageIDsDict[this.objectID] = this
        
        // init Artboard own things
        this.artboardType = artboardType
        this.isModal = Constants.ARTBOARD_TYPE_MODAL == this.artboardType
        this.externalArtboardURL = externalArtboardURL
        
        this.showShadow = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_SHADOW)
        if(undefined!=this.showShadow)
            this.showShadow = this.showShadow == 1
        else{
            const legacyShadow = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LEGACY_ARTBOARD_MODAL_SHADOW)
            if(undefined!=legacyShadow &&  Constants.ARTBOARD_TYPE_MODAL == this.artboardType){
                this.showShadow = legacyShadow
            }else{
                this.showShadow = true
            }
        }
        
        this.overlayOverFixed = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED) == 1
        {
            var overlayAlsoFixed = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED)
            this.overlayAlsoFixed = overlayAlsoFixed!=undefined?overlayAlsoFixed:true
        }

        this.disableAutoScroll =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL)
        this.transNextSecs = 
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
        if(undefined != this.transNextSecs && '' == this.transNextSecs)
            this.transNextSecs = undefined

        this.overlayByEvent = exporter.Settings.layerSettingForKey(this.slayer,SettingKeys.ARTBOARD_OVERLAY_BY_EVENT)
        if (this.overlayByEvent == undefined || this.overlayByEvent == "") this.overlayByEvent = 0

        this.overlayAlign = exporter.Settings.layerSettingForKey(this.slayer,SettingKeys.ARTBOARD_OVERLAY_ALIGN)
        if (this.overlayAlign == undefined || this.overlayAlign == "") this.overlayAlign = 0
        
    }

    export(){        
        this._exportImages()
        this._findFixedPanelHotspots()
        //this._exportOverlayLayers()
        this._pushIntoJSStory(this.pageIndex)
    }

    resetCustomArtboardSize(){
        if(exporter.customArtboardFrame){
            if(this.oldFrame!=undefined){
                const slayer = Sketch.fromNative(this.nlayer)
                slayer.frame = this.oldFrame.copy()
            }
        }
    }

    //------------------- FIND HOTSPOTS WHICH LOCATE OVER FIXED HOTPOSTS ----------------------------
    //------------------- AND MOVE THEM INTO FIXED LAYER SPECIAL HOTSPOTS ---------------------------
    _findFixedPanelHotspots(){
        for (var l of this.fixedLayers){
            for (let hIndex=0;hIndex<this.hotspots.length;hIndex++){
                let hotspot = this.hotspots[hIndex]
                // move hotspot from artboard hotspots to fixed layer hotspots
                if(hotspot.r.insideRectangle(l.frame)){
                    this.hotspots.splice(hIndex--,1)                                        
                    hotspot.r.x-=l.frame.x
                    hotspot.r.y-=l.frame.y
                    l.hotspots.push(hotspot)                    
                }
            }
            
        }
    }

    //------------------ GENERATE STORY.JS FILE  ------------------
    _pushIntoJSStory(pageIndex) {
        const mainName = this.name

        exporter.logMsg("process main artboard " + mainName);
        exporter.totalImages++

        let js = pageIndex ? ',' : '';
        js +=
            '$.extend(new ViewerPage(),{\n' + 
            '"index": ' + parseInt(pageIndex) + ',\n' +
            '"image": "' + Utils.quoteString(Utils.toFilename(mainName + '.png', false)) + '",\n'
        if (exporter.retinaImages)
            js +=
                '"image2x": "' + Utils.quoteString(Utils.toFilename(mainName + '@2x.png', false)) + '",\n'
        js +=
            '"width": ' + parseInt(this.frame.width) + ',\n' +
            '"height": ' + parseInt(this.frame.height) + ',\n' +
            '"title": "' + Utils.quoteString(mainName) + '",\n';

        if( this.transNextSecs!=undefined ){
            js += "'transNextMsecs': " + parseFloat(this.transNextSecs)*1000 + ",\n";
        }

        if (this.disableAutoScroll) {
            js += "'disableAutoScroll': " + (this.disableAutoScroll ? 'true' : 'false') + ",\n";
        }

        {
            var layoutGrid = this.nlayer.layout() // class: MSLayoutGrid
            if(!layoutGrid) layoutGrid = MSDefaultLayoutGrid.defaultLayout();
            if(layoutGrid){
                var data = {
                    offset:             layoutGrid.horizontalOffset(),
                    totalWidth:         layoutGrid.totalWidth(),
                    numberOfColumns:    layoutGrid.numberOfColumns(),
                    columnWidth:        layoutGrid.columnWidth(),
                    gutterWidth:        layoutGrid.gutterWidth()
                }
                js += "'layout' : " +JSON.stringify(data,null,"\t") +",\n"
            } 
        }

        if (this.isModal) {
            js += "'type': 'modal',\n";
            js += "'isModal': true,\n";
            js += "'showShadow': " + (this.showShadow ? 1 : 0) + ",\n";
        } else if (this.externalArtboardURL!=undefined && this.externalArtboardURL!=''){
            js += "'type': 'external',\n";
        } else if (Constants.ARTBOARD_TYPE_OVERLAY == this.artboardType){
            js += "'type': 'overlay',\n";
            // try to find a shadow
            if(this.showShadow){
                const layerWithShadow = this._getOverlayShadowLayer()                
                if(layerWithShadow){
                    const shadowInfo = layerWithShadow.getShadowAsStyle()                    
                    js += "'overlayShadow':'"+shadowInfo.style+"',\n"
                    js += "'overlayShadowX':"+shadowInfo.x+",\n"
                }
            }else if(Constants.ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT == this.overlayAlign) {
                const layerWithShadow = this._getOverlayShadowLayer()                
                if(layerWithShadow){
                    const shadowInfo = layerWithShadow.getShadowAsStyle()                    
                    js += "'overlayShadowX':"+shadowInfo.x+",\n"
                }
            }
            js += "'overlayByEvent': "+this.overlayByEvent+",\n";
            js += "'overlayAlign': "+this.overlayAlign+",\n";
            js += "overlayOverFixed:"+(this.overlayOverFixed?"true":"false")+",\n"
            js += "overlayAlsoFixed:"+(this.overlayAlsoFixed?"true":"false")+",\n"
        } else {
            js += "'type': 'regular',\n";
        }

        // add fixed layers
        js += this._pushFixedLayersIntoJSStory()

        // add hotspots 
        js += "'links' : " +JSON.stringify(this._buildHotspots(this.hotspots),null,"\t") +",\n" 
            

        js+="})\n"

        exporter.jsStory += js;
    }


    _getOverlayShadowLayer(){
        return this._findLayersShadow(this.childs)
    }   

    _findLayersShadow(layers){
        for(var l of layers){            
            let layerWithShadow = this._findLayerShadow(l)
            if(layerWithShadow) return layerWithShadow
        }
        return undefined
    }

    _findLayerShadow(l){
        let shadowsStyle = l.getShadowAsStyle()
        if(shadowsStyle!==undefined) return l

        return this._findLayersShadow(l.childs)
    }
    

    _pushFixedLayersIntoJSStory() {
        let recs = []

        if (this.fixedLayers.length) {
            const mainName = this.name
            const foundPanels = []
            for (var l of this.fixedLayers) {
                let type = l.fixedType
                if(type == "") {
                    exporter.logError("pushFixedLayersIntoJSStory: can't understand fixed panel type for artboard '" + this.name 
                        + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    continue
                }
                exporter.totalImages++

                if (!l.isFloat && foundPanels[type]) {
                    exporter.logError("pushFixedLayersIntoJSStory: found more than one panel with type '" + type + "' for artboard '" 
                        + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    const existedPanelLayer = foundPanels[type]
                    exporter.logError("pushFixedLayersIntoJSStory: already exists panel layer='" + existedPanelLayer.name 
                        + "' layer.frame=" + existedPanelLayer.frame)
                    continue
                }
                foundPanels[type] = l

                const fileNamePostfix = !(l.isFloat||l.isFixedDiv)?"":('-'+l.fixedIndex)            
                               

                const rec = {
                    constrains:l.constrains,
                    x:l.frame.x,
                    y:l.frame.y,
                    width:l.frame.width,
                    height:l.frame.height,
                    type:type,
                    index:l.fixedIndex,
                    isFloat: l.isFloat,
                    isFixedDiv: l.isFixedDiv,
                    divID: l.layerDivID!=undefined?l.layerDivID:"",
                    links: this._buildHotspots(l.hotspots,true),                    
                    image:Utils.quoteString(Utils.toFilename(mainName,false) + fileNamePostfix+'.png')
                }                
                if (exporter.retinaImages)
                    rec.image2x = Utils.quoteString(Utils.toFilename(mainName,false) + fileNamePostfix +'@2x.png', false)
                
                // setup shadow
                const layerWithShadow = this._findLayerShadow(l)                
                if(layerWithShadow){
                    const shadowsStyle = layerWithShadow.getShadowAsStyle()
                    rec.shadow = shadowsStyle.style        
                    rec.shadowX = shadowsStyle.x                    
                }
                recs.push(rec)
            }
        }

        let js = "'fixedPanels': " + JSON.stringify(recs,null,"\t")+",\n";

        return js
    }



    _buildHotspots(srcHotspots,isParentFixed=false) {        
        let newHotspots = []
        for(var hotspot of srcHotspots){
            const newHotspot = {
               rect: hotspot.r,
               isParentFixed:isParentFixed,
            }

            //log(' _buildHotspots linkType='+hotspot.linkType+" l.name="+hotspot.l.name+" l.target="+hotspot.target)

            if (hotspot.linkType == 'back') {
                newHotspot.action = 'back'
            } else if (hotspot.linkType == 'artboard' && exporter.pagesDict[hotspot.artboardID] != undefined 
                && exporter.pageIDsDict[hotspot.artboardID].externalArtboardURL != undefined
            ) {
                newHotspot.url = exporter.pageIDsDict[hotspot.artboardID].externalArtboardURL                
            } else if (hotspot.linkType == 'artboard') {
                const targetPage = exporter.pageIDsDict[hotspot.artboardID]
                if (targetPage == undefined) {
                    exporter.logMsg("undefined artboard: '" + hotspot.artboardName + '"');
                    continue
                }
                const targetPageIndex = targetPage.pageIndex;
                newHotspot.page = targetPageIndex
            } else if (hotspot.linkType == 'href') {
                newHotspot.url = hotspot.href        
            } else if (hotspot.target != undefined) {
                newHotspot.target = hotspot.target
            } else {
                exporter.logMsg("_pushHotspotIntoJSStory: Uknown hotspot link type: '" + hotspot.linkType + "'")
            }

            if (hotspot.target != undefined) {
                newHotspot.target = hotspot.target
            }

            newHotspot.index = this.nextLinkIndex++
            newHotspots.push(newHotspot)

        }
        return newHotspots
    }


    //------------------ GENERATE IMAGES  ------------------


    _getImageName(scale,panelPostix="") {
        const suffix = scale == 2 ? "@2x" : "";
        return Utils.toFilename(this.name, false) + panelPostix +  suffix + ".png";
      }

    _exportImage(scale,layer,nlayer,panelPostix="",addToExported = true) {
        exporter.logMsg("   exportImage() for "+nlayer.name())
        
        const imageName = this._getImageName(scale,panelPostix)
        const imagePath = exporter.imagesPath + imageName
        let slice = null

        if(addToExported) exporter.exportedImages.push(imageName)

        if (nlayer.isKindOfClass(MSArtboardGroup)) {
            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
        } else if (layer && layer.isFixed) {
            let frame = layer.frame.copy()
            frame.x += layer.artboard.slayer.frame.x
            frame.y += layer.artboard.slayer.frame.y
            slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer.artboard.nlayer,frame.copyToRect(),false).firstObject()
        } else {            
            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
            //slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(nlayer, nlayer.absoluteInfluenceRect(), false).firstObject();
        }
        slice.scale = scale;
        slice.saveForWeb = false;
        slice.format = "png";
        exporter.ndoc.saveArtboardOrSlice_toFile(slice, imagePath);
    }

    // new experimental code to export images
    // we don't use it because it doesn't allow to set a file name
    _exportImage2(scales,slayer) {
        exporter.logMsg("exportImage()");
        
        const imagePath = exporter.imagesPath // + this._getImageName(scales)
        log('_exportImage2 name='+slayer.name)
        const options = { 
            scales: scales,
            output: exporter.imagesPath,
            overwriting: true,
            'save-for-web': true, 
            formats: 'png' 
        }
        Sketch.export(slayer, options)        
        
    }

    _exportImages() {
        log("  exportArtboardImages: running... " + this.name)
        let scales = exporter.retinaImages?[1,2]:[1]    
        
        // hide fixed panels to generate a main page content without fixed panels 
        // and their artefacts (shadows)
        this._hideFixedLayers(true)
        
        // export fixed panels to their own image files
        this._exportFixedLayersToImages(scales)

        for(var scale of scales){                     
            this._exportImage(scale,this,this.nlayer,'',Constants.ARTBOARD_TYPE_OVERLAY != this.artboardType)
        }
        
        // show fixed panels back
        // ! temporary disabled because an exported image still shows hidden layers
        this._hideFixedLayers(false)

        log("  exportArtboardImages: done!")
    }


    _exportOverlayLayers(){
        log('_exportOverlayLayers: running')  
        let scales = exporter.retinaImages?[1,2]:[1]  
        for(const layer of this.overlayLayers){         
            log('_exportOverlayLayers: '+layer.name)               
            // need 
            const artboard = this._findArtboardByName(layer.name+"@")
            if(!artboard) continue
            //
            for(var scale of scales){                     
                this._exportImage(scale,undefined,artboard.sketchObject,"-"+layer.name,false)
            }            
            //
        }
        log('_exportOverlayLayers: done!')  
    }


    _exportFixedLayersToImages(scales){
        for(var layer of this.fixedLayers){               
            layer.calculateFixedType()         

            // temporary disable fixed panel shadows
            let orgShadows = undefined
            let layerWithShadow = this._findLayerShadow(layer)            
            if(layerWithShadow){
                orgShadows = layerWithShadow.slayer.style.shadows
                layerWithShadow.slayer.style.shadows = []            
            }
            
            // for div and  float fixed layer we need to generate its own image files
            if(layer.isFloat || layer.isFixedDiv){

                layer.slayer.hidden = false

                //this._exportImage2('1, 2',layer.parent.slayer)         
                for(var scale of scales){                                       
                    const l = layer.parent.isSymbolInstance?layer:layer
                    this._exportImage(scale,l,l.nlayer,"-"+layer.fixedIndex,false)
                }                 

                layer.slayer.hidden = true
            }

            // restore original fixed panel shadows
            if(layerWithShadow){
                layerWithShadow.slayer.style.shadows  = orgShadows
            }
        }
    }

    _hideFixedLayers(hide){         
        const show = !hide
        for(var layer of this.fixedLayers){
            // we need to hide/show only div and  float panels
            if(layer.isFloat || layer.isFixedDiv){
                layer.slayer.hidden = hide
            }

            // temporary remove fixed panel shadows
            if(hide){
                layer.fixedShadows = layer.slayer.style.shadows
                layer.slayer.style.shadows = []  
            }

            // restore original fixed panel shadows
            if(show){
                layer.slayer.style.shadows  = layer.fixedShadows
            }

       }
    }


}
