@import("constants.js")
@import("lib/utils.js")
Sketch = require('sketch/dom')

var PZPage_touched = false

class PZPage {

    // spage: ref to Sketch Page
    constructor(sPage) {
        this.sPage = sPage
        this.mArtboards = []
    }

    collectData(sArtboards = null) {
        if (DEBUG) exporter.logMsg("PZPage.collectData() starting... name=" + (this.sPage ? this.sPage.name : ''))
        // 
        if (!sArtboards) sArtboards = this.sPage.layers

        // prepare layers for collecting
        if (DEBUG) exporter.logMsg("PZPage.collectData() preparing...")
        for (const sa of sArtboards) {
            if ("Artboard" != sa.type) continue
            if (exporter.filterAster && sa.name.indexOf("*") == 0) continue

            // special trick to add some data change event to Sketch as Undo point
            if (!PZPage_touched) {
                sa.frame.y += 10
                PZPage_touched = true
            }

            this._scanLayersToSaveInfo(sa)
            this._scanLayersToDetachSymbols(sa)
        }

        // collect layers
        if (DEBUG) exporter.logMsg("PZPage.collectData() collecting...")
        this._collectArtboards(sArtboards)

        // cleanup temporary data
        //this._cleanUp()        
    }


    export() {
        for (const a of this.mArtboards) {
            a.export()
        }
        //// export itself
        if (this.sPage != null) {
            const data = {
                'id': String(this.sPage.id),
                name: this.sPage.name
            }
            exporter.storyData.groups.push(data)
        }
    }


    // return index of new artboard
    addArtboard(mArtboard) {
        this.mArtboards.push(mArtboard)
        mArtboard.index = pzDoc.addArtboard(mArtboard)
    }



    //////////////////////// PRIVATE FUNCTIONS //////////////////////////////////////

    _scanLayersToSaveInfo(sParent) {
        if (DEBUG) exporter.logMsg("PZPage._scanLayersToSaveInfo() running name=" + (this.sPage ? this.sPage.name : ''))
        const nParent = sParent.sketchObject

        // taken here - https://sketchplugins.com/d/466-get-all-symbol-and-all-image-inside-selected-storyboard
        const symbolPredicate = NSPredicate.predicateWithFormat("className == %@", 'MSSymbolInstance');
        const symbolInstances = nParent.children().filteredArrayUsingPredicate_(symbolPredicate);

        symbolInstances.forEach(function (nl) {
            const sl = Sketch.fromNative(nl)
            let symbolId = sl.symbolId

            const smaster = pzDoc.getSymbolMasterByID(symbolId)
            if (!smaster) {
                log("_scanLayersToSaveInfo() Error: can't find master for" + sl.name)
                return
            }

            // save target artboard ID to restore info about master afte the detach      
            // save symbol ID to restore info about master after the detachs
            //sl.name = sl.name + "±±" + (sl.flow ? sl.flow.targetId : "") + "±±" + sl.symbolId



            var text = new Text({
                text: ""
            })
            text.name = "±±" + sl.name + "±±" + (sl.flow ? sl.flow.targetId : "") + "±±" + symbolId
            text.hidden = true
            text.frame.x = sl.frame.x
            text.frame.y = sl.frame.y
            text.frame.width = 0
            text.frame.height = 0
            sl.parent.layers.push(text)

            /*
            exporter.context.command.setValue_forKey_onLayer_forPluginIdentifier(sl.symbolId, 'symbolID', nl, Constants.PLUGIN_IDENTIFIER)
            if (sl.flow)
                exporter.context.command.setValue_forKey_onLayer_forPluginIdentifier(sl.flow.targetId, 'flowTargetId', nl, Constants.PLUGIN_IDENTIFIER)
            else
                exporter.context.command.setValue_forKey_onLayer_forPluginIdentifier(null, 'flowTargetId', nl, Constants.PLUGIN_IDENTIFIER)
            */

            // go deeply
            this._scanLayersToSaveInfo(smaster)
        }, this)
    }

    _scanLayersToDetachSymbols(sParent) {
        if (DEBUG) exporter.logMsg("PZPage._scanLayersToDetachSymbols() runnning...name=" + (this.sPage ? this.sPage.name : ''))
        const nParent = sParent.sketchObject

        const symbolPredicate = NSPredicate.predicateWithFormat("className == %@", 'MSSymbolInstance');
        const symbolInstances = nParent.children().filteredArrayUsingPredicate_(symbolPredicate);

        symbolInstances.forEach(function (nl) {
            var sl = Sketch.fromNative(nl)
            sl = sl.detach({
                recursively: true
            })
            if (DEBUG) exporter.logMsg("PZPage._scanLayersToDetachSymbols() symbol:" + sl.name)
        }, this)

        if (DEBUG) exporter.logMsg("PZPage._scanLayersToDetachSymbols() completed")
    }

    _collectArtboards(sArtboards) {
        for (var sa of this._sortArtboards(sArtboards)) {
            if ("SymbolMaster" == sa.type) continue
            if ("Artboard" != sa.type) continue
            if (exporter.filterAster && sa.name.indexOf("*") == 0) continue
            const ma = new PZArtboard(sa)
            ma.collectLayers(' ')
            this.addArtboard(ma)
        }
    }


    // Resort artboards using configuration settings
    _sortArtboards(sSrcArtboards) {
        var sArtboards = sSrcArtboards.slice()
        if (Constants.SORT_RULE_X == exporter.sortRule) {
            sArtboards.sort((
                function (a, b) {
                    return a.frame.x - b.frame.x
                }))
        } else if (Constants.SORT_RULE_Y == exporter.sortRule) {
            sArtboards.sort((
                function (a, b) {
                    return a.frame.y - b.frame.y
                }))
        } else if (Constants.SORT_RULE_REVERSIVE_SKETCH == exporter.sortRule) {
            sArtboards = sArtboards.reverse()
        } else {
        }
        return sArtboards
    }


}
