@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

var PZPage_touched = false

class PZPage{

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
        this.mArtboards = []
    }

    collectData(sArtboards=null){
        exporter.logMsg("PZPage.collectData() starting... name="+(this.sPage?this.sPage.name:''))
        // 
        if(!sArtboards) sArtboards = this.sPage.layers

        // prepare layers for collecting
        exporter.logMsg("PZPage.collectData() preparing...")
        for(const sa of sArtboards){
            if("Artboard"!=sa.type) continue
            if(exporter.filterAster && sa.name.indexOf("*")==0) continue
            log("PZPage.collectData for "+sa.name)

            // special trick to add some data change event to Sketch as Undo point
            if(!PZPage_touched){
                sa.frame.y+=10
                PZPage_touched = true
            }

            this._scanLayersToSaveInfo(sa)        
            this._scanLayersToDetachSymbols(sa)       
        }
        
        // collect layers
        exporter.logMsg("PZPage.collectData() collecting...")
        this._collectArtboards(sArtboards)

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



    //////////////////////// PRIVATE FUNCTIONS //////////////////////////////////////


    /*_clonePage(sPage){
        const sClone = sPage.duplicate()
        sClone.name = Constants.TEMP_PAGE_PREFIX + sClone.name
        return sClone
    }  
    */
    _scanLayersToSaveInfo(sParent){        
        exporter.logMsg("PZPage._scanLayersToSaveInfo() running name="+(this.sPage?this.sPage.name:''))
        const nParent = sParent.sketchObject

        nParent.children().forEach(function(nl){
            if(!(nl instanceof MSSymbolInstance )) return
         
            const sl = Sketch.fromNative(nl)
            if(sl.name.indexOf("±±")>=0){
                //remove old garabage
                sl.name = sl.name.substring(0,sl.name.indexOf("±±"))                
            }     
            const smaster = pzDoc.getSymbolMasterByID(sl.symbolId)
            if(!smaster){
                log("Error: can't find master for"+sl.name)
                return  
            }
            // save target artboard ID to restore info about master afte the detach      

            //log("PZPage._scanLayersToSaveInfo() old name="+ sl.name)
            // save symbol ID to restore info about master after the detachs
            sl.name = sl.name + "±±" + (sl.flow?sl.flow.targetId:"") + "±±" + sl.symbolId
        },this)
    }

    _scanLayersToDetachSymbols(sParent){
        exporter.logMsg("PZPage._scanLayersToDetachSymbols() runnning...name="+(this.sPage?this.sPage.name:''))
        const nParent = sParent.sketchObject

        nParent.children().forEach(function(nl){
            if(!(nl instanceof MSSymbolInstance )) return
            
            var sl = Sketch.fromNative(nl)
            sl = sl.detach({
                recursively: true
            })   

        },this)
      
        exporter.logMsg("PZPage._scanLayersToDetachSymbols() completed")
    }

    _collectArtboards(sArtboards){
        for(var sa of this._sortArtboards(sArtboards)){            
            if("SymbolMaster"==sa.type) continue
            if("Artboard"!=sa.type) continue
            if(exporter.filterAster && sa.name.indexOf("*")==0) continue
            const ma = new PZArtboard(sa)
            ma.collectLayers(' ')
            this.addArtboard(ma)
        }        
    }


    // Resort artboards using configuration settings
    _sortArtboards(sSrcArtboards){        
        var sArtboards = sSrcArtboards.slice()
        if(Constants.SORT_RULE_X == exporter.sortRule){
            sArtboards.sort((
            function(a, b){
              return a.frame.x - b.frame.x
          }))
        }else if(Constants.SORT_RULE_Y == exporter.sortRule){
            sArtboards.sort((
            function(a, b){
              return a.frame.y - b.frame.y
          }))
        }else  if(Constants.SORT_RULE_REVERSIVE_SKETCH == exporter.sortRule){
            sArtboards = sArtboards.reverse()
        }else{
        }
        return sArtboards
    }


}
