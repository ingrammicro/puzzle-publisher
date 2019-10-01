@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')


class PZPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
        this.mArtboards = []
    }

    collectData(){
        exporter.logMsg("PZPage.run() name="+this.sPage.name)
        // 

        //this.sPage = this._clonePage(this.sPageOrg)

        // prepare layers for collecting
        this._scanLayersToSaveInfo(this.sPage.layers)        
        this._scanLayersToDetachSymbols(this.sPage.layers)       
        
        // collect layers
        this._collectArtboards(this.sPage.layers)

        // cleanup temporary data
        //this._cleanUp()        
    }

    buildLinks(space){
        for(const a of this.mArtboards){
            a.buildLinks(space+" ")
        }
    } 


    export(){
        for(const a of this.mArtboards){
            a.export()
        }
    }


    // return index of new artboard
    addArtboard(mArtboard){
        this.mArtboards.push(mArtboard)
        mArtboard.index = pzDoc.addArtboard(mArtboard)
    }

    // Resort artboards using configuration settings
    sortArtboards(){        
        if(Constants.SORT_RULE_X == exporter.sortRule){
          this.mArtboards.sort((
            function(a, b){
              return a.frame.x - b.frame.x
          }))
        }else  if(Constants.SORT_RULE_REVERSIVE_SKETCH == this.sortRule){
            this.mArtboards = this.mArtboards.reverse()
        }else{
        }
    }

    //////////////////////// PRIVATE FUNCTIONS //////////////////////////////////////

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
                //sl.name = sl.name + "}}" + String(sl.id)
                //log("PZPage._scanLayersToSaveInfo() id="+ sl.name)
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
                //log("PZPage._scanLayersToSaveInfo() name="+ sl.name)
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
        for(var sa of sArtboards){
            if("SymbolMaster"==sa.type) continue
            const ma = new PZArtboard(sa)
            ma.collectLayers(' ')
            this.addArtboard(ma)
        }        
    }

    _cleanUp(sPage){
        this.sPage.remove()
        this.sPage = undefined
    }



}
