@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')


class PZPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPageOrg = sPage
        this.sPageClone = undefined
        this.mArtboards = []
    }

    run(){
        exporter.logMsg("PZPage.run() name="+this.sPageOrg.name)
        // 

        this.sPageClone = this._clonePage(this.sPageOrg)

        // prepare layers for collecting
        this._scanLayersToSaveInfo(this.sPageClone.layers)        
        this._scanLayersToDetachSymbols(this.sPageClone.layers)       
        
        // collect layers
        this._collectArtboards(this.sPageClone.layers)

        // cleanup temporary data
        //this._cleanUp()
    }

    _clonePage(sPage){
        const sClone = sPage.duplicate()
        sClone.name = Constants.TEMP_PAGE_PREFIX + sClone.name
        return sClone
    }

    _scanLayersToSaveInfo(sLayers){
        for(var sl of sLayers){
            if("SymbolMaster"==sl.type){
                continue
            }
            if("Artboard"==sl.type){
                sl.name = sl.name + "}}" + String(sl.id)
                log("PZPage._scanLayersToSaveInfo() id="+ sl.name)
            }
            if("SymbolInstance"==sl.type){
                const smaster = pzDoc.getSymbolMasterByID(sl.symbolId)
                if(!smaster){
                    log("Error: can't find master for"+sl.name)
                    continue
                }
                if(sl.name.indexOf("{}")>=0){
                    // remove old garabage
                    sl.name = sl.name.substring(0,sl.name.indexOf("{}"))
                }
                sl.name = sl.name + "{}" + sl.symbolId
                this._scanLayersToSaveInfo(smaster.layers)
            }else if("Group"==sl.type || "Artboard"==sl.type){
                this._scanLayersToSaveInfo(sl.layers)
            }               
        }
    }

    _scanLayersToDetachSymbols(sLayers){
        for(var sl of sLayers){
            log('PZPage._scanLayersToDetachSymbols() sl.type='+sl.type)
            if("SymbolMaster"==sl.type){
                continue
            }
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

    _collectArtboards(sArtboards){
        const mArtboards = []
        for(var sa of sArtboards){
            if("SymbolMaster"==sa.type) continue
            const ma = new PZArtboard(sa)
            ma.collectLayers(' ')
            mArtboards.push(ma)
        }

        this.mArtboards = mArtboards
    }

    _cleanUp(sPageClone){
        this.sPageClone.remove()
        this.sPageClone = undefined
    }



}
