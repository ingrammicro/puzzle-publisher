@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

var pzDoc = null

class PZDoc{
    constructor(){
        pzDoc = this
        var Document = require('sketch/dom').Document
        this.sDoc = Document.getSelectedDocument()
        this.mPages = []
        this.mAllLayers = []
        this.mLinkedLayers = []
        this.sSymbols = undefined    
        this.artboardCount = 0
        this.startArtboardIndex = 0

        this.artboardsDict = {}
        this.artboardIDsDict = {}
        this.jsLibs = undefined
    }

    collectData(){
        // init required data
        this._buildSymbolDict()

        // cleanup previous garbage
        /*for(var sPage of this.sDoc.pages){
            if(sPage.name.startsWith(Constants.TEMP_PAGE_PREFIX)){                
                sPage.remove()
                continue
            }           
        }*/
        
        // build local pages
        const mPages = []
        const filterAster = null==exporter.exportOptions || !('mode' in exporter.exportOptions)
        
        for(var sPage of this.sDoc.pages){

            if(filterAster && sPage.name.indexOf("*")==0) continue

            // create new local Page object
            const mPage =  new PZPage(sPage)
            mPage.collectData()
            mPages.push(mPage)
        }
        this.mPages = mPages            
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
            let pathToSymbolTokens = Utils.cutLastPathFolder(lib.jsDoc.path)+"/"+ lib.jsLib.name +  "-inspector.json"
            //log('pathToSymbolTokens = '+pathToSymbolTokens+" name="+lib.jsLib.name)        
            const inspectorData =  Utils.readFile(pathToSymbolTokens)
            if(inspectors!="") inspectors+=","
            inspectors += "'"+lib.jsLib.name+"':"+(inspectorData?inspectorData:"{}")
        }
       
        return "var symbolsData = {"+inspectors+"};"
    }

    getJSON(){        
    
        log(" getJSON: cleanup before saving...")
        for(var l of this.mAllLayers) l.clearRefsBeforeJSON()

        log(" getJSON: running...")
        const json =  JSON.stringify(this.mAllLayers,replacer,null)
        log(" getJSON: done!")        

        return json
    }

    undoChanges(){
        Utils.actionWithType("MSUndoAction").doPerformAction(nil);      
    }
    



    //////////////////////////// PUBLIC HELPERS  ///////////////////////


    // return index of new artboard
    addArtboard(mArtboard){        
        this.artboardsDict[mArtboard.name] = mArtboard
        this.artboardIDsDict[mArtboard.objectID] = mArtboard

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
        var jsArtboard = undefined
        for(const lib of this._getLibraries()){
            exporter.logMsg("findLibraryArtboardByID getLayerWithID for lib "+lib.jsLib.name)
            jsArtboard = lib.jsDoc.getLayerWithID(artboardID)
            if(jsArtboard) break
        }
        if(!jsArtboard){            
            exporter.logMsg("findLibraryArtboardByID FAILED")
            return false
        }

        // Create new page
        this._addLibraryPage(jsArtboard)       
        return this.artboardIDsDict[artboardID]
    }

    _addLibraryPage(sArtboard){
        const mPage = new PZPage(null)
        this.mPages.push(mPage)
        mPage.collectData([sArtboard])
    }



    _getLibraries(){
        if(undefined!=this.jsLibs) return this.jsLibs
        
        log("_getLibraries: start")
        this.jsLibs = []

        var libraries = require('sketch/dom').getLibraries()
        for(const jsLib of libraries){
            if(!jsLib.valid || !jsLib.enabled) continue        
            log("_getLibraries: try to load document for library "+jsLib.name+"")

            const jsDoc = jsLib.getDocument() 
            if(!jsDoc){
                log("_getLibraries: can't load document for library "+jsDoc.path+"")
                continue
            }
            this.jsLibs.push({
                jsLib: jsLib,
                jsDoc: jsDoc
            })
        }
        log("_getLibraries: finish")
        return this.jsLibs
    }


    _buildSymbolDict() {
        var sSymbols = []

        for(const sSymbol of this.sDoc.getSymbols()){
            const sid = sSymbol.symbolId
            if( sid in sSymbols) continue                        
            sSymbols[ sid ] = sSymbol      
        }
            

        this.sSymbols = sSymbols
    }
}
