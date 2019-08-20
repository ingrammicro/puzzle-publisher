@import("lib/uidialog.js")
@import("lib/utils.js")
@import("constants.js")


var onRun = function(context) {
  const sketch = require('sketch')
  const Settings = require('sketch/settings')
  const UI = require('sketch/ui')
  const document = sketch.fromNative(context.document)
  const selection = document.selectedLayers

  UIDialog.setUp(context)

  // Check selection
  if(selection.length!=1){
    UI.alert("alert","Select only one layer.")
    return
  }
  var layer = selection.layers[0]

  // Get current settings for this layer (and reset to default if undefined)
  //--------------------------------------------------------------------
  var annotations = Settings.layerSettingForKey(layer,SettingKeys.LAYER_ANNOTATIONS)  
  if(annotations == undefined || annotations == null){
    annotations = ""
  } 

  const dialog = new UIDialog("Edit Layer Annotations",NSMakeRect(0, 0, 300, 200),"Save","Annotations will be visible in generated HTML.")
  dialog.addTextBox("annotations","", annotations,"",200)


  if(dialog.run()){
    Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_ANNOTATIONS, dialog.views['annotations'].stringValue()+"")
  }
  dialog.finish()

}
