@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

class MyPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
    }

    run(){
        // 
        var sPageClone = this._clonePage(this.sPage)

        this._scanLayersToDetachSymbols(sPageClone.layers)        

        sPageClone = this._cleanUp(sPageClone)
    }

    _clonePage(sPage){
        return sPage.duplicate()
    }

    _scanLayersToDetachSymbols(sLayers){
        for(var sl of sLayers){
            if("SymbolInstance"==sl.type){
                log("++++++++++++++++++ found SymbolInstance")
                sl = sl.detach({
                    recursively: true
                })                
                if(!sl) continue                                
                log("++++++++++++++++++ symbolName:"+sl.name)

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
