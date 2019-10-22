@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

const replaceValidKeys = ["frame","x","y","width","height","constrains","childs","smName","styleName","text","comment","smLib"]  
// smName: symbol master Name
function replacer(key, value) {
  // Pass known keys and array indexes
  if (value!=undefined && (replaceValidKeys.indexOf(key)>=0 ||  !isNaN(key))) {
    return value
  }    
  return undefined
}

var pzDoc = null

class PZDoc{
    constructor(){
        pzDoc = this
        var Document = require('sketch/dom').Document
        this.sDoc = Document.getSelectedDocument()
        this.mPages = []
        this.mAllLayers = []
        this.mLinkedLayers = []
        this.sSymbols = {}    
        this.artboardCount = 0
        this.startArtboardIndex = 0

        this.mAllArtboards = []
        this.artboardsDict = {}
        this.artboardIDsDict = {}
        this.jsLibs = undefined

    }

    collectData(){
        // init required data
        this._buildSymbolDict()
        
        // build local pages
        const mPages = []
    

        if (Constants.EXPORT_MODE_CURRENT_PAGE == exporter.exportOptions.mode){
            // build only current page 
            const mPage =  new PZPage( Sketch.fromNative(exporter.exportOptions.currentPage))
            mPage.collectData()
            mPages.push(mPage)
        }else if (Constants.EXPORT_MODE_SELECTED_ARTBOARDS == exporter.exportOptions.mode){
            // build only selected artboards on current page         
            const mPage =  new PZPage( Sketch.fromNative(exporter.exportOptions.currentPage))
            mPage.collectData(exporter.exportOptions.selectedArtboards)
            mPages.push(mPage)

        }else {
            // build all pages and artboards
            for(var sPage of this.sDoc.pages){
                exporter.logMsg("PZDoc:collectData() process page="+sPage.name)

                if(exporter.filterAster && sPage.name.indexOf("*")==0) continue

                // create new local Page object
                const mPage =  new PZPage(sPage)
                mPage.collectData()
                mPages.push(mPage)
            }
        }
        this.mPages = mPages

        ///
        this._collectLibArtboards()
    }    


    buildLinks(){
        log('PZDoc.buildLinks: running')
        for(var mLayer of this.mLinkedLayers){
            mLayer.buildLinks(' ');    
        }
        log('PZDoc.buildLinks: stop')
    }
    

    export(){
        log(" PZDoc:run running...")
        this.totalImages = 0
    
        for(var page of this.mPages){
            page.export();    
        }

        log(" PZDoc:run done!")
    }

    getSymbolData(){
        // load library inspector file
        let inspectors = ""
        const libs = this._getLibraries()
        for(const lib of libs){
            let pathToSymbolTokens = Utils.cutLastPathFolder(lib.sDoc.path)+"/"+ lib.jsLib.name +  "-inspector.json"
            //log('pathToSymbolTokens = '+pathToSymbolTokens+" name="+lib.jsLib.name)        
            const inspectorData =  Utils.readFile(pathToSymbolTokens)
            if(inspectors!="") inspectors+=","
            inspectors += "'"+lib.jsLib.name+"':"+(inspectorData?inspectorData:"{}")
        }
       
        return "var symbolsData = {"+inspectors+"};"
    }

    getJSON(){        
    
        log(" getJSON: cleanup before saving...")
        this.mAllLayers.forEach(l => {
            l.clearRefsBeforeJSON()
        });

        log(" getJSON: running...")
        const json =  JSON.stringify(this.mAllArtboards,replacer,null)
        log(" getJSON: done!")        

        return json
    }

    undoChanges(){    
        Utils.actionWithType(this.sDoc.sketchObject,"MSUndoAction").doPerformAction(nil);
        
        this.jsLibs = []
    
    }
    



    //////////////////////////// PUBLIC HELPERS  ///////////////////////


    // return index of new artboard
    addArtboard(mArtboard){        
        this.artboardsDict[mArtboard.name] = mArtboard
        this.artboardIDsDict[mArtboard.objectID] = mArtboard
        this.mAllArtboards.push(mArtboard)
        
        if(mArtboard.nlayer.isFlowHome()){
            this.startArtboardIndex = this.artboardCount
        }

        return this.artboardCount++

    }


    // return Sketch native object
    findArtboardByID(artboardID){
        let artboard = this.artboardIDsDict[artboardID]
        if(artboard) return artboard
        return this._findLibraryArtboardByID(artboardID)
    }

    getLayerWithID(id){
        return this.sDoc.getLayerWithID(id)
    }

    getSymbolMasterByID(id){    
        if( !(id in this.sSymbols)){
            log('getSymbolMasterByID can not find symbol by ID='+id)
            return undefined            
        }
        return this.sSymbols[id]
    }


    //////////////////////////// PRIVATE ///////////////////////


    _collectLibArtboards(){
        for(const mLayer  of this.mLinkedLayers){
            if(mLayer.flow && mLayer.flow.targetID && !(mLayer.flow.targetID in this.artboardIDsDict)){
                const mArtboard =  this._findLibraryArtboardByID(artboardID)
            }
        }
    }

    _sortArboards(){
        const exportOptions = exporter.exportOptions

        for(const mPage of this.mPages){
            mPage.sortArboards()
        }

    }

    // return Sketch native object
    _findLibraryArtboardByID(artboardID){
        exporter.logMsg("findLibraryArtboardByID running...  artboardID:"+artboardID)
        // find Sketch Artboard
        var sArtboard = undefined
        var lib = undefined
        for(lib of this._getLibraries()){
            exporter.logMsg("findLibraryArtboardByID getLayerWithID for lib "+lib.jsLib.name)
            sArtboard = lib.sDoc.getLayerWithID(artboardID)
            if(sArtboard) break
        }
        // check artboard existing
        if(!sArtboard){            
            exporter.logMsg("findLibraryArtboardByID FAILED")
            return false
        }

        // Create new page
        this._buildSymbolDict(lib.sDoc)
        const mPage = new PZPage(null)
        mPage.collectData([sArtboard])
        this.mPages.push( mPage )

        return this.artboardIDsDict[artboardID]
    }

    _getLibraries(){
        if(undefined!=this.jsLibs) return this.jsLibs
        
        log("_getLibraries: start")
        this.jsLibs = []

        var libraries = require('sketch/dom').getLibraries()
        for(const jsLib of libraries){
            if(!jsLib.valid || !jsLib.enabled) continue        
            log("_getLibraries: try to load document for library "+jsLib.name+"")

            const sDoc = jsLib.getDocument() 
            if(!sDoc){
                log("_getLibraries: can't load document for library "+sDoc.path+"")
                continue
            }
            this.jsLibs.push({
                jsLib: jsLib,
                sDoc: sDoc
            })
        }
        log("_getLibraries: finish")
        return this.jsLibs
    }


    _buildSymbolDict(sDoc=null) {
        if(!sDoc) sDoc = this.sDoc

        for(const sSymbol of sDoc.getSymbols()){
            const sid = sSymbol.symbolId
            if( sid in this.sSymbols) continue                        
            this.sSymbols[ sid ] = sSymbol      
        }            
    }
}
