@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

var pzDoc = null

class PZPDoc{
    constructor(){
        pzDoc = this
        var Document = require('sketch/dom').Document
        this.sDoc = Document.getSelectedDocument()
        this.mPages = []
    }

    run(){
        const mPages = []
        for(var sPage of this.sDoc.pages){
            const mPage =  new PZPage(sPage)
            mPage.run()
            mPages.push(MyPage)
        }
        this.mPages = mPages
    }

    getLayerWithID(id){
        return this.sDoc.getLayerWithID(id)
    }
}

class PZPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
        this.sPageClone = undefined
    }

    run(){
        // 
        this.sPageClone = this._clonePage(this.sPage)

        this._scanLayersToSaveMasterInfo(this.sPageClone.layers)        

        this._scanLayersToDetachSymbols(this.sPageClone.layers)        

        this.sPageClone = this._cleanUp(sPageClone)
    }

    _clonePage(sPage){
        const sClone = sPage.duplicate()
        sClone.name = "(temp)"+sClone.name
        return sClone
    }

    _scanLayersToSaveMasterInfo(sLayers){
        for(var sl of sLayers){
            if("SymbolInstance"==sl.type){
                const smaster = exporter.symDict[sl.symbolId]
                if(!smaster){
                    log("Error: can't find master for"+sl.name)
                    continue
                }
                sl.name = sl.name + "{}" + sl.symbolId
                this._scanLayersToSaveMasterInfo(Sketch.fromNative(smaster).layers)
            }else if("Group"==sl.type || "Artboard"==sl.type){
                this._scanLayersToSaveMasterInfo(sl.layers)
            }               
        }
    }

    _scanLayersToDetachSymbols(sLayers){
        for(var sl of sLayers){
            if("SymbolInstance"==sl.type){
                sl = sl.detach({
                    recursively: true
                })                
                if(!sl) continue                                
            }else if("Group"==sl.type || "Artboard"==sl.type){
                this._scanLayersToDetachSymbols(sl.layers)
            }               
        }
    }

    _cleanUp(sPageClone){
        sPageClone.remove()
        return null
    }



}
