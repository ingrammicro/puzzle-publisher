@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')


class PZPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
        this.mArtboards = []
    }

    collectData(sLayers=null){
        exporter.logMsg("PZPage.collectData() name="+(this.sPage?this.sPage.name:''))
        // 
        if(null==sLayers) sLayers = this.sPage.layers

        //this.sPage = this._clonePage(this.sPageOrg)

        // prepare layers for collecting
        this._scanLayersToSaveInfo(sLayers)        
        this._scanLayersToDetachSymbols(sLayers)       
        
        // collect layers
        this._collectArtboards(sLayers)

        // cleanup temporary data
        //this._cleanUp()        
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

    /*_clonePage(sPage){
        const sClone = sPage.duplicate()
        sClone.name = Constants.TEMP_PAGE_PREFIX + sClone.name
        return sClone
    }  
    */
    _scanLayersToSaveInfo(sLayers){
        exporter.logMsg("PZPage._scanLayersToSaveInfo() running name="+(this.sPage?this.sPage.name:''))
        for(var sl of sLayers){                      
            if("SymbolMaster"==sl.type){
                continue
            }
            if("Artboard"==sl.type){
                //sl.name = sl.name + "}}" + String(sl.id)
                //log("PZPage._scanLayersToSaveInfo() id="+ sl.name)
            }
            if("SymbolInstance"==sl.type){                

                if(sl.name.indexOf("±±")>=0){
                    //remove old garabage
                    sl.name = sl.name.substring(0,sl.name.indexOf("±±"))                
                }     
                const smaster = pzDoc.getSymbolMasterByID(sl.symbolId)
                if(!smaster){
                    log("Error: can't find master for"+sl.name)
                    continue
                }
                // save target artboard ID to restore info about master afte the detach      

                //log("PZPage._scanLayersToSaveInfo() old name="+ sl.name)
                // save symbol ID to restore info about master after the detachs
                sl.name = sl.name + "±±" + (sl.flow?sl.flow.targetId:"") + "±±" + sl.symbolId
                //log("name="+sl.name)
                //log("PZPage._scanLayersToSaveInfo() new name="+ sl.name)
                this._scanLayersToSaveInfo(smaster.layers)
            }else if("Group"==sl.type || "Artboard"==sl.type){
                this._scanLayersToSaveInfo(sl.layers)
            }               
        }
        exporter.logMsg("PZPage._scanLayersToSaveInfo() competed")
    }

    _scanLayersToDetachSymbols(sLayers){
        exporter.logMsg("PZPage._scanLayersToDetachSymbols() runnning...name="+(this.sPage?this.sPage.name:''))
        for(var sl of sLayers){
            //log('PZPage._scanLayersToDetachSymbols() sl.type='+sl.type)
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
        exporter.logMsg("PZPage._scanLayersToDetachSymbols() completed")
    }

    _collectArtboards(sArtboards){
        for(var sa of sArtboards){            
            if("SymbolMaster"==sa.type) continue
            const ma = new PZArtboard(sa)
            ma.collectLayers(' ')
            this.addArtboard(ma)
        }        
    }

}
