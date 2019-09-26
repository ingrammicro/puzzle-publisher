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

Sketch = require('sketch/dom')

class PZLayer {

    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(sLayer,myParent) {
        this.nlayer = sLayer.sketchObject
        this.name = sLayer.name
        this.parent = myParent
        this.objectID = sLayer.id
        this.originalID = undefined
        this.symbolMaster = undefined
        this.slayer = sLayer
        this.artboard = myParent ? myParent.artboard : this
        this.isParentFixed = undefined!=myParent && (myParent.isFixed || myParent.isParentFixed)
    
        // define type    
        this.isArtboard = false
        this.isGroup = false
        this.isSymbolInstance = false

        this.customLink = undefined

        //log('+++++ this.name: ' + this.name + " isParentFixed: "+this.isParentFixed+ " parent:"+(undefined!=myParent?myParent.name:"none"))

        if("Group"==sLayer.type || "Artboard"==sLayer.type ) this.isGroup = true
        const symbolIDPos = this.name.indexOf("{}")
        if(symbolIDPos>=0){
            this.isSymbolInstance = true 
            const symbolID = this.name.substring(symbolIDPos+2)
            this.symbolMaster = pzDoc.getSymbolMasterByID(symbolID)

            // restore original name
            this.name = this.name.substring(0,symbolIDPos)
            this.slayer.name = this.name

            // prepare data for Element Inspector
            const lib = this.symbolMaster.getLibrary()            
            if(lib){
                this.smName = this.symbolMaster.name()+""                
                this.smLib = lib.name
            }
        }else{
            this.smName = undefined

            // prepare data for Element Inspector            
            var sharedStyle = this.slayer.sharedStyle
            if(sharedStyle){
                this.styleName = sharedStyle.name
            }
            if("Text"==sLayer.type){
                this.text = this.slayer.text+""
            }
        }
        if("Artboard"==sLayer.type )  this.isArtboard = true        

        var comment = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_COMMENT)
        if(undefined!=comment && ''!=comment){
            this.comment = comment
        }

        this.childs = []  
        this.hotspots = [] 
        
        this.frame = slayer.frame
        this.orgFrame = slayer.frame
        if(myParent!=undefined) this.constrains = this._calculateConstrains()
        
        if(!this.isArtboard && !exporter.disableFixedLayers && !this.isParentFixed){
            var overlayType = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_OVERLAY_TYPE)
            if(undefined==overlayType || ''==overlayType)
                overlayType = Constants.LAYER_OVERLAY_DEFAULT
            
            if(this.nlayer.isFixedToViewport() || overlayType!=Constants.LAYER_OVERLAY_DEFAULT){
                this.addSelfAsFixedLayerToArtboad(overlayType)    
            }
        }

         // check special internal properties
         // check: if this layer provides browser window background color
         if(""==exporter.backColor){            
            while(true){
                if(this.name.indexOf(Constants.INT_LAYER_NAME_BACKCOLOR)<0) break
                let fills =  this.slayer.style.fills
                if(undefined==fills) break
                fills =  fills.filter(function(el){return el.enabled})
                if(0==fills.length) break
                exporter.backColor = fills[0].color                
                break
            }
        }   
        // check: if this layer provides browser favicon
        if(this.name.indexOf(Constants.INT_LAYER_NAME_SITEICON)>=0){
            exporter.siteIconLayer = this
        }
        // check: if this layer contains special overlay
        if(!this.isArtboard && this.name.indexOf(Constants.INT_LAYER_NAME_OVERLAYONHOVER)>=0){
            this.hasHoverOverlay = true
            this.artboard.overlayLayers.push(this)
        }

        this._processHotspots(">>")

    }

    _calculateConstrains(){
        const resizingConstraint = 63 ^ this.nlayer.resizingConstraint()
        const res = {
            top : (resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP,
            bottom : (resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM,
            left : (resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT,
            right : (resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT,
            height : (resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT,
            width: (resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH
        }
        return res        
    }    

    collectAChilds(sLayers,space){
        exporter.logMsg(space+"PZLayer.collectAChilds() name="+this.name)
        var aLayers = []
        for(const sl of sLayers){
            const al = new PZLayer(sl)
            if(al.isGroup) al.childs = al.collectAChilds(sl.layers,space+" ")
            aLayers.push(al)
        }        
        return aLayers
    }

    addSelfAsFixedLayerToArtboad(overlayType){         

        if(Constants.LAYER_OVERLAY_DIV==overlayType){
            var layerDivID = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_DIV_ID)
            if(layerDivID!=undefined && layerDivID!=''){
                this.layerDivID = layerDivID
            }else{
                // No Div ID = No div overlay
                return
            }
        }
        
        this.isFixed = true
        this.overlayType = overlayType
        this.fixedIndex = this.artboard.fixedLayers.length
        this.artboard.fixedLayers.push(this)
    }

    calculateFixedType(){     
        let type = "";

        if(Constants.LAYER_OVERLAY_DIV==this.overlayType){
            type = 'div'
        }else if(Constants.LAYER_OVERLAY_TRANSP_TOP==this.overlayType){
           type = "top";      
        }else if(Constants.LAYER_OVERLAY_TRANSP_LEFT==this.overlayType){
            type = "left";      
        }else	
            type = "float"

        this.fixedType = type
        this.isFloat = type=='float'
        this.isFixedDiv = type=='div'
                
    }

    getShadowAsStyle(){
        if(this.slayer.style==undefined ||  this.slayer.style.shadows==undefined || this.slayer.style.length==0) return undefined

        let shadowInfo = undefined
        for(var shadow of this.slayer.style.shadows){
            if(!shadow.enabled) continue
            let shadowsStyle=""

            if(shadowsStyle!="") shadowsStyle+=","
            shadowsStyle += shadow.x + "px "
            shadowsStyle += shadow.y + "px "
            shadowsStyle += shadow.blur + "px "
            shadowsStyle += shadow.spread + " "
            shadowsStyle += shadow.color + " "

            shadowInfo = {
                style:  shadowsStyle,
                x:      shadow.x + shadow.blur
            }
        }

        return shadowInfo
    }


    _processHotspots(prefix){
        const l = this
        const hotspots = []

        let finalHotspot = {
            r: this.frame.copy(),
            //l: l,
            linkType: 'undefined',
            target: null
        }

        if(this.hasHoverOverlay){
            const hoverHotsport = {
                r:          l.frame.copy(),
                linkType:   'artboard',
                artboardID: l.hoverOverlayArtboardID
            }
            this.currentArtboard.hotspots.push(hoverHotsport)
        }
        
        while(true){               

            // check link to external URL
            const externalLinkHref = exporter.Settings.layerSettingForKey(l.slayer,SettingKeys.LAYER_EXTERNAL_LINK)
            if(externalLinkHref!=null && externalLinkHref!="" && externalLinkHref!="http://"){
                const externalLink = {
                    'href' : externalLinkHref,
                    'openNewWindow': exporter.Settings.layerSettingForKey(l.slayer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)==1

                }
                if( !this._specifyExternalURLHotspot(prefix+" ",finalHotspot,externalLink)) return
                break            
            }            

            // check native link
            if(l.flow){
                if( !this._specifyHotspot(prefix+" ",l,finalHotspot)) return
                break
            }

            // No any link on layer
            return
        }
        exporter.logMsg(prefix+"_processLayerLinks: finalHotspot type="+finalHotspot.linkType)
        hotspots.push(finalHotspot);          

        // finalization
        Array.prototype.push.apply(this.currentArtboard.hotspots, hotspots);            
    }


    _specifyHotspot(prefix,l,finalHotspot){        
        const layer = l.nlayer
        const flow = exporter.Sketch.fromNative(layer.flow());
        const targetArtboardID = flow.targetId;
    
        if(flow.isBackAction()){
            // hande Back action
            finalHotspot.linkType = "back";
            exporter.logMsg(prefix+"hotspot: back")        
        }else if(targetArtboardID!=null && targetArtboardID!="" && targetArtboardID!="null"){
            // hande direct link
            let targetArtboard = pzDoc.findArtboardByID(targetArtboardID)

            if(!targetArtboard){
                exporter.logWarning("Broken link to missed artboard on layer '"+l.name+"' on artboard '"+l.artboard.name+"'")
                return false
            }

            if(targetArtboard.externalArtboardURL!=undefined){                
                const externalLink = {
                    'href' : targetArtboard.externalArtboardURL,
                    'openNewWindow':  exporter.Settings.layerSettingForKey(targetArtboard.slayer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)==1  
                }
                finalHotspot.artboardID = targetArtboard.objectID                
                this._specifyExternalURLHotspot(prefix+" ",finalHotspot,externalLink)
            }else{            
                finalHotspot.linkType = "artboard";
                finalHotspot.artboardID = targetArtboardID;
                finalHotspot.href = Utils.toFilename(targetArtboard.name) + ".html";
            }

            exporter.logMsg(prefix+"hotspot: artboard ")
            
        }else{                    
            exporter.logMsg(prefix+"hotspot: none  l.isSymbolInstance="+l.isSymbolInstance)
            return false
        }
        return true
    }



    clearRefsBeforeJSON(){
        // need to cleanup temp object to allow dump it into JSON
        // but keep nlayer because Exporter.exportImage() needs it
        this.symbolMaster = undefined
        this.tempOverrides = undefined
        this.slayer = undefined
        //l.nlayer = undefined
        this.customLink = undefined

        //log('---- this.smName:')
        //log( this.smName )
        //log('---- this.name:')
        //log( this.name)


        for(var l of this.childs){
            l.clearRefsBeforeJSON()
        }
    }

    exportSiteIcon(){
        const nlayer = this.nlayer
        const layer = this
        
        const imageName = "icon.png"
        const imagePath = exporter._outputPath+"/resources/"+imageName;

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
