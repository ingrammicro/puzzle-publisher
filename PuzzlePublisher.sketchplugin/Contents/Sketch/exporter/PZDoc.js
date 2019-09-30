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
        this.sSymbols = undefined    

        this.pagesDict = {}
        this.pageIDsDict = {}
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
        for(var sPage of this.sDoc.pages){

            // create new local Page object
            const mPage =  new PZPage(sPage)
            mPage.collectData()
            mPages.push(mPage)
        }
        this.mPages = mPages
    }

    export(){
        log(" PZDoc:run running...")
        this.totalImages = 0
    
        for(var page of this.mPages){
            page.export();    
        }

        this._undoChanges()

        log(" PZDoc:run done!")
    }

    _undoChanges(){
        const type = "MSUndoAction"
  
	    var controller = exporter.context.document.actionsController();

        if (controller.actionWithName) {
            return controller.actionWithName(type);
        } else if (controller.actionWithID) {
            return controller.actionWithID(type);
        } else {
            return controller.actionForID(type);
        }
	}


    // return Sketch native object
    findArtboardByID(artboardID){
        let artboard = this.pageIDsDict[artboardID]
        if(artboard) return artboard
        return this._findLibraryArtboardByID(artboardID)
    }

    // return Sketch native object
    _findLibraryArtboardByID(artboardID){
        exporter.logMsg("findLibraryArtboardByID running...  artboardID:"+artboardID)
        // find Sketch Artboard
        var jsArtboard = undefined
        for(const lib of this._getLibraries()){
            jsArtboard = lib.jsDoc.getLayerWithID(artboardID)
            if(jsArtboard) break
        }
        if(!jsArtboard){
            log(this.pageIDsDict)
            exporter.logMsg("findLibraryArtboardByID FAILED")
            return false
        }

        // Create new page
        const mPage =  new PZPage(jsArtboard.parent)
        mPage.run()
        this.mPages.push(mPage)

        return this._findLibraryArtboardByID(artboardID)
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


    getLayerWithID(id){
        return this.sDoc.getLayerWithID(id)
    }

    getSymbolMasterByID(id){    
        return this.sSymbols[id]
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
