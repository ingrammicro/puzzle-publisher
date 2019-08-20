@import("constants.js")
@import("lib/utils.js")
@import("exporter/child-finder.js")

var ResizingType = {
    STRETCH: 0,
    PIN_TO_CORNER: 1,
    RESIZE_OBJECT: 2,
    FLOAT_IN_PLACE: 3
}


class MyLayerResizer {
    constructor() {        
        this.childFinder = new ChildFinder()
    }
    
    resizeLayers(prefix){
        log( prefix+"resizeLayers: running...")
        this._resizeLayers(prefix+" ",exporter.myLayers)
        log( prefix+"resizeLayers: done!")
    }



    _resizeLayers(prefix,layers,topOffset=undefined,lostOverrides=[]){
        layers.forEach(function (layer) {
            if(layer.parent == undefined){
                // process top layer (artboard)            
                this.currentArtboard = layer
            }
            this._resizeLayer(layer,topOffset,prefix+" ",lostOverrides)
        }, this);
    }

    _resizeLayer(l,topOffset,prefix,lostOverrides){        
        const layer = l.nlayer
        const master = l.symbolMaster
        const parent = l.parent
        const e = this.e

        exporter.logMsg( prefix+l.name+" id="+l.nlayer.objectID())
        
        l.frame = Utils.copyRectToRectangle(layer.absoluteRect())        
        l.orgFrame = Utils.copyRectToRectangle(layer.frame())        

        if(l.parent==undefined){
            // reset top artboard absolute position
            topOffset = new Rectangle(l.frame.x,l.frame.y,0,0)
            l.frame.x = 0
            l.frame.y = 0
        }else{  
            // apply top offset to all childs
            l.frame.x -= topOffset.x
            l.frame.y -= topOffset.y
        }        
        
        if(l.isSymbolInstance){                
            l.orgFrame.width = master.absoluteRect().width()
            l.orgFrame.height = master.absoluteRect().height()
           
            exporter.logLayer(prefix+" _resizeLayer() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name)      
        }          

        const srcFrame = l.frame.copy()
        
        // --------------- CONSTRAINT --------------
        if (layer.resizingConstraint != undefined) {   
           this._applyLayerConstrains(prefix,l)
        }     

        if(l.isSymbolInstance ){      
            // reset topOfset for all symbol content
            topOffset = new Rectangle(master.absoluteRect().x() - l.frame.x, master.absoluteRect().y() - l.frame.y,0,0)
           
            exporter.logLayer(prefix+" _resizeLayer1() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name + " master.absoluteRect="+master.absoluteRect())      
        }else if(l.isGroup ){      
            // reset topOfset for all symbol content
            topOffset = new Rectangle(layer.absoluteRect().x() - l.frame.x, layer.absoluteRect().y() - l.frame.y,0,0)
           
            exporter.logLayer(prefix+" _resizeLayer2() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name + " absoluteRect="+layer.absoluteRect())      
        } 

        this._processLayerLinks(l,prefix+" ",lostOverrides)
        if(l.tempOverrides!=undefined){
            lostOverrides = Object.assign({}, lostOverrides, l.tempOverrides);
            exporter.logMsg(prefix+" _resizeLayer, newOverrides="+Object.keys(lostOverrides).length) 
        }

        exporter.logLayer(prefix+"- frame="+l.frame+ " topOffset: "+topOffset + " absoluteRect="+layer.absoluteRect() )
          
        this._resizeLayers(prefix,l.childs,topOffset,lostOverrides)               
    }

    _processLayerLinks(l,prefix,lostOverrides){
        
        const layer = l.nlayer
        const hotspots = []

        let finalHotspot = {
            r: l.frame.copy(),
            //l: l,
            linkType: 'undefined',
            target: null
        }

        this._processLayerOverrides(l,prefix + " ",lostOverrides)

        if(l.name=='Customers@OverlayOnhover@'){
            //log('=--------------- Customers@OverlayOnhover@ ----------------') //--
        }

        if(l.hasHoverOverlay){
            const hoverHotsport = {
                r:          l.frame.copy(),
                linkType:   'artboard',
                artboardID: l.hoverOverlayArtboardID
            }
            this.currentArtboard.hotspots.push(hoverHotsport)
            //log(prefix+"_processLayerLinks: [[[hasHoverOverlay]]]"+l.hoverOverlayArtboardID) //--
        }
        
        while(true){               
            // check custom link from parent overrides
            if(l.customLink!=undefined){
                if( !this._specifyCustomizedHotspot(prefix+" ",l,finalHotspot)  ) return        
                break
            }

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
            if(layer.flow()!=null){
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

    _specifyExternalURLHotspot(prefix,finalHotspot,externalLink){           
        exporter.logMsg(prefix+"_specifyExternalURLHotspothotspot: href")
        // found external link
        const regExp = new RegExp("^http(s?)://");
        var href= externalLink.href
        if (!regExp.test(href.toLowerCase())) {
            href = "http://" + href;
        }
        const target = externalLink.openNewWindow ? "_blank" : null;

        finalHotspot.linkType = "href"
        finalHotspot.href = href
        finalHotspot.target = target        

        return true
    }

    _specifyCustomizedHotspot(prefix,l,finalHotspot){     
        exporter.logMsg(prefix+"CUSTOM hotspot: " + l.customLink.linkType)  
        finalHotspot.linkType = l.customLink.linkType                
        
        if(l.customLink.linkType=="back"){                    
            // linkType copied already, nothing more to do for Back link
        }else if(l.customLink.linkType=="href"){
            exporter.logMsg("_specifyCustomizedHotspot: href name="+l.name+" "+l.customLink.artboardID)
            finalHotspot.href = l.customLink.href 
            finalHotspot.target = l.customLink.target
        }else if(l.customLink.linkType=="artboard"){
            const targetArtboardID = l.customLink.artboardID
            const targetArtboard = exporter.findArtboardByID(targetArtboardID)
            exporter.logMsg("_specifyCustomizedHotspot: artboard name="+l.name+" "+l.customLink.artboardID)
            finalHotspot.artboardID = targetArtboardID
            finalHotspot.artboardName = targetArtboard.name
            finalHotspot.href = Utils.toFilename(targetArtboard.name) + ".html";
        }else{
            exporter.logMsg(prefix+"CUSTOM hotspot: " + l.customLink.linkType)  
            return false            
        }
        return true
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
            let targetArtboard = exporter.findArtboardByID(targetArtboardID)

            if(!targetArtboard){
                log("_specifyHotspot() Can't find artboard with ID='"+targetArtboardID+"' for layer='"+l.name+"'")
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


    // Process all Symbol Instance overrides to find overrided links
    _processLayerOverrides(l,prefix,lostOverrides){
        const slayer = l.slayer
        
        let newLostOverrides = undefined
        let overrides = []

        if( lostOverrides!=undefined && l.objectID in lostOverrides) Array.prototype.push.apply(overrides,lostOverrides[l.objectID])    
        if( l.isSymbolInstance && slayer.overrides) Array.prototype.push.apply(overrides,slayer.overrides)
        
        if(overrides.length==0) return newLostOverrides        
        

        // check if target was customized
        overrides.forEach(function (customProperty){       
            if( !(customProperty.property==='flowDestination' && !customProperty.isDefault && customProperty.value!='') ) return;        

            let sourceID =  customProperty.path
            exporter.logMsg(prefix+"found custom property / sourceID="+sourceID +  " customProperty.value="+customProperty.value)

            let srcLayer = undefined            
            if(sourceID.indexOf("/")>0){
                // found nested symbols
                const splitedPath = sourceID.split("/")
                // find override owner
                exporter.logMsg(prefix+"override owner path="+sourceID)            
                srcLayer = this.childFinder.findChildInPath(prefix+" ",l,splitedPath,0)                
                if(srcLayer==undefined && !(l.objectID in lostOverrides) )
                {          
                    exporter.logMsg(prefix+"pushed to newLostOverrides")         

                    if(newLostOverrides==undefined) 
                        newLostOverrides = []
                    const firstID = splitedPath[0]
                    if(!(firstID in newLostOverrides)) 
                        newLostOverrides[firstID] = []
                    newLostOverrides[firstID].push(customProperty)

                    exporter.logMsg(prefix+" pushed newOverrides="+(newLostOverrides?newLostOverrides[firstID].length:" undefined"))
                }
            }else{       
                srcLayer = this.childFinder.findChildByID(l,sourceID)
            }
                       
            if(srcLayer) exporter.logMsg(prefix+"found srcLayer: "+srcLayer.name)

            if(srcLayer==undefined){
                exporter.logMsg(prefix+"ERROR! can't find child by ID="+sourceID)
                return
            }
            
            // srcLayer link was already overrided by parents
            if(srcLayer.customLink!=undefined){
                return
            }
            
            // setup customLink
            if(customProperty.value=='back'){
                // handle Back link
                srcLayer.customLink = {
                    linkType: "back"
                }
                exporter.logMsg(prefix+"srcLayer.customLink.linkType="+srcLayer.customLink.linkType)
                return
            }else{       
                const targetArtboardID = customProperty.value
                const targetArtboard = exporter.findArtboardByID(targetArtboardID)

                // handle link to artboard
                if(!targetArtboard){
                    log("_specifyHotspot() Can't find artboard with ID='"+targetArtboardID+"'")
                    return
                }

                // handle link to External Artboard
                if(targetArtboard.externalArtboardURL!=undefined){                
                    const externalLink = {
                        'href' : targetArtboard.externalArtboardURL,
                        'openNewWindow':  exporter.Settings.layerSettingForKey(targetArtboard.slayer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)==1        
                    }
                    srcLayer.customLink = {
                        artboardID: targetArtboard.objectID
                    }
                    this._specifyExternalURLHotspot(prefix+" ",srcLayer.customLink,externalLink)                
                }else{
                    // handle link to Reguler Artboard
                    srcLayer.customLink = {
                        linkType: "artboard",
                        artboardID: targetArtboard.objectID
                    }
                }                                
                //log(prefix+"srcLayer.customLink.linkType="+srcLayer.customLink.linkType+" artboardID="+ srcLayer.customLink.artboardID+" customValue='"+customProperty.value+"'")
                return
            }

        },this);       
        
        exporter.logMsg(prefix+" _processLayerOverrides, newLostOverrides="+newLostOverrides) 
        l.tempOverrides = newLostOverrides
    }


    _applyLayerConstrains(prefix,l){
        const layer = l.nlayer
        if (layer.resizingConstraint == undefined || l.parent == undefined) return
        
        const parent = l.parent
        let parentAbsoluteFrame = parent.frame
        let parentOrgFrame = parent.orgFrame
        const orgFrame = l.orgFrame

        /*
        if(parent.isSymbolInstance){
            parentOrgFrame =  new Rectangle(parentAbsoluteFrame.x,parentAbsoluteFrame.y,parent.symbolMaster.frame().width(),parent.symbolMaster.frame().height())
        }else{
            parentOrgFrame = parentAbsoluteFrame
        }*/
        
        // CHECK DO WE NEED TO CALCULATE CONSTRAINS
        if (parentAbsoluteFrame.width==parentOrgFrame.width && parentAbsoluteFrame.height==parentOrgFrame.height) return
        let newFrame = l.frame.copy()
    
        exporter.logLayer(prefix+" getAbsoluteRect() 0 parent name:"+parent.name+" parentOrgFrame= "+parentOrgFrame+" parentAbsoluteFrame="+parentAbsoluteFrame )
        exporter.logLayer(prefix+" getAbsoluteRect() 0 frame:"+l.frame + " orgFrame:"+l.orgFrame )

        const frame = l.frame        
        
        if (l.constrains.left) {
            if (l.constrains.rigth) {
                exporter.logLayer(prefix+" getAbsoluteRect() 2 "+newFrame.y);
                const rightDistance = parentOrgFrame.width - orgFrame.x - orgFrame.width
                const width = parentAbsoluteFrame.width - orgFrame.x - rightDistance
                newFrame.width = width < 1 ? 1 : width;
            } else if (!l.constrains.width) {
                exporter.logLayer(prefix+" getAbsoluteRect() 3");
                newFrame.width = (frame.width / (parentOrgFrame.width - orgFrame.x)) * (parentAbsoluteFrame.width - orgFrame.x);
            }
        } else if (l.constrains.right) {
            if (l.constrains.width) {
                exporter.logLayer(prefix+" getAbsoluteRect() 4");
                newFrame.x = (parentAbsoluteFrame.width - (parentOrgFrame.width - (frame.x + frame.width)) - frame.width);
            } else {
                const rightDistance = parentOrgFrame.width - orgFrame.x - orgFrame.width;
                newFrame.width = (frame.width / (parentOrgFrame.width - rightDistance)) * (parentAbsoluteFrame.width - rightDistance);
                newFrame.x = parentAbsoluteFrame.width - (parentOrgFrame.width - (frame.x + frame.width)) - newFrame.width
                exporter.logLayer(prefix+" getAbsoluteRect() 5 rightDistance="+rightDistance);
            }
        } else {
            if (l.constrains.width) {
                newFrame.x = parentAbsoluteFrame.x + ((((orgFrame.x + frame.width / 2.0) / parentOrgFrame.width) * parentAbsoluteFrame.width) - (orgFrame.width / 2.0));
                exporter.logLayer(prefix+" getAbsoluteRect() 6");
            } else {
                const inc = parentOrgFrame.width / parentAbsoluteFrame.width
                newFrame.x = frame.x + (orgFrame.x / inc) - orgFrame.x
                newFrame.width = frame.width / inc
                exporter.logLayer(prefix+" getAbsoluteRect() 7 inc="+inc);
            }
        }

        if (l.constrains.top) { 
            if (l.constrains.bottom) {
                const bottomDistance = parentOrgFrame.height - orgFrame.y - orgFrame.height;
                const height = parentAbsoluteFrame.height - orgFrame.y - bottomDistance;
                newFrame.height = height < 1 ? 1 : height;
                exporter.logLayer(prefix+" getAbsoluteRect() 8 ret.y="+newFrame.y+  "parent.y="+parentAbsoluteFrame.y+" frame.y="+frame.y);
            } else if (!l.constrains.height) {
                newFrame.height = (frame.height / (parentOrgFrame.height - orgFrame.y)) * (parentAbsoluteFrame.height - orgFrame.y);
                exporter.logLayer(prefix+" getAbsoluteRect() 9");
            }
        } else if (l.constrains.bottom) {
            if (l.constrains.height) {
                newFrame.y = (parentAbsoluteFrame.height - (parentOrgFrame.height - (frame.y + frame.height)) - frame.height);
                exporter.logLayer(prefix+" getAbsoluteRect() 10");
            } else {
                const bottomDistance = parentOrgFrame.height - orgFrame.y - orgFrame.height
                newFrame.height = (frame.height / (parentOrgFrame.height - bottomDistance)) * (parentAbsoluteFrame.height - bottomDistance)
                newFrame.y =  parentAbsoluteFrame.height - (parentOrgFrame.height - (frame.y + frame.height)) - newFrame.height
                exporter.logLayer(prefix+" getAbsoluteRect() 11 bottomDistance="+bottomDistance);
            }
        } else {
            if (l.constrains.height) {
                newFrame.y = ((((frame.y + frame.height / 2.0) / parentOrgFrame.height) * parentAbsoluteFrame.height) - (frame.height / 2.0));
                exporter.logLayer(prefix+" getAbsoluteRect() 12");
            } else {
                const inc = parentOrgFrame.height / parentAbsoluteFrame.height
                newFrame.y = frame.y + (orgFrame.y / inc) - orgFrame.y
                newFrame.height = frame.height / inc
                exporter.logLayer(prefix+" getAbsoluteRect() 13 inc="+inc);
            }
        }
        newFrame.round()

        //exporter.logMsg(prefix+" getAbsoluteRect() 99 old "+l.frame + " const=")
        l.frame = newFrame        
        //exporter.logMsg(prefix+" getAbsoluteRect() 99 new "+newFrame)
            
    }
    

}
