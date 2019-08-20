@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js"

var onRun = function(context) {
  const sketch = require('sketch')
  var UI = require('sketch/ui')
  var Settings = require('sketch/settings')  
  UIDialog.setUp(context);


  const document = sketch.fromNative(context.document)
  var selection = document.selectedLayers

  // We need at least one layer
  //--------------------------------------------------------------------
  if(selection.length==0){
    UI.alert("alert","Select at least one layer.")
    return
  }
  var layers = selection.layers;

  // Get current settings for this layer (and reset to default if undefined)
  //--------------------------------------------------------------------
  var link = ""
  var openNewWindow = false

  if(layers.length==1){
    var layer = layers[0]
    // restore settings for a single layer selected
    link = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK)
    if(undefined==link || 'http://'==link) link = ""// workaround to fix previous wrong dialog behaviour
    openNewWindow = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)==1
  }

  // Ask user for external URL
  //--------------------------------------------------------------------
  const dialog = new UIDialog("Provide some external URL",NSMakeRect(0, 0, 400, 100),"Save","The selected layers or artboards will be linked to the specified URL.")


  dialog.addTextInput("url","URL", link,'http://',350)  
  dialog.addCheckbox("sameWindow","Open new browser window", openNewWindow)


  //Save new external URL
  //--------------------------------------------------------------------
  while (true) {
    // Cancel clicked
    if (!dialog.run()) break;

    // OK clicked
    // read data
    link =  dialog.views['url'].stringValue() + ""
    openNewWindow = dialog.views['sameWindow'].state() == 1

    // check data
    if (false) {
        continue
    }

    // save data  
    layers.forEach(function(layer){
        Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK,link)
        Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN,openNewWindow)
    })

    break
  }
  

  dialog.finish()
}