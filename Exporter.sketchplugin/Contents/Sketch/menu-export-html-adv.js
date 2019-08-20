@import "lib/utils.js"
@import "lib/uidialog.js"
@import "exporter/exporter-run.js"
@import "constants.js"


function askMode(context){
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const document = sketch.fromNative(context.document)
  
  UIDialog.setUp(context);

  let mode = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_MODE)
  if(mode==undefined || mode=="") mode = Constants.EXPORT_MODE_SELECTED_ARTBOARDS

  //
  const dialog = new UIDialog("Export to HTML",NSMakeRect(0, 0, 300, 80),"Export","")

  dialog.addRadioButtons("mode","", mode,["Selected artboards","Current page artboards"],250)

  if(dialog.run()){
    mode = dialog.views['mode'].selectedIndex
    Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_MODE, mode)
  }else{
    mode = -1
  }
  dialog.finish()

  return mode
}

var onRun = function(context) {  
  const Dom = require('sketch/dom')
  const doc = context.document
  const sketch = require('sketch')
  const document = sketch.fromNative(doc)
  const Doc = Dom.fromNative(doc)
  const Settings = require('sketch/settings') 
  var UI = require('sketch/ui')
  
  const mode = askMode(context)
  if(mode<0) return

  const modeOptions={
    "mode":mode,
    "selectedLayers":null,
    "currentPage":null
  }  

  // check is something to export
  if(mode==Constants.EXPORT_MODE_SELECTED_ARTBOARDS){
    const filteredArtboards=[]
    for (var i = 0; i < document.selectedLayers.length; i++) {  
      const l = document.selectedLayers.layers[i]
      if(l.type=='Artboard') filteredArtboards.push(l)
    }
    if (filteredArtboards.length==0) {
      UI.alert("alert","There are no selected artboards to export.")
      return
    }
    modeOptions['selectedArtboards'] = filteredArtboards

  }else if (mode==Constants.EXPORT_MODE_CURRENT_PAGE){
    modeOptions['currentPage'] = doc.currentPage()
  }else{
    return
  }  
  runExporter(context,modeOptions) 
};

