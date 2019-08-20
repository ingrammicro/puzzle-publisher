@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    var UI = require('sketch/ui')
    const document = sketch.fromNative(context.document)
    var selection = document.selectedLayers
    var layers = selection.layers;

    UIDialog.setUp(context);

    // We need at least one layer
    if (layers.length != 1) {
        UI.alert("alert", "Select some single layer.")
        return
    }

    var layer = layers[0]
    if('Artboard'==layer.type){
        UI.alert("alert", "Select some single layer.")
        return
    }

    // read settings

    var layerDivID = Settings.layerSettingForKey(layer, SettingKeys.LAYER_DIV_ID)
    if (undefined == layerDivID) layerDivID = ""
    var layerComment = Settings.layerSettingForKey(layer, SettingKeys.LAYER_COMMENT)
    if (undefined == layerComment) layerComment = ""

    let overlayType = Settings.layerSettingForKey(layer, SettingKeys.LAYER_OVERLAY_TYPE)
    if (overlayType == undefined || overlayType == "")
        overlayType = SettingKeys.LAYER_OVERLAY_DEFAULT

    // create dialog
    const dialog = new UIDialog("Layer Settings", NSMakeRect(0, 0, 400, 200), "Save", "Configure selected layer options ")

    dialog.addComboBox("overlayType","Overlay Mode", overlayType,["Default (using \"Fix position\" setting)","Trasparent overlay with fixed position (TOP)","Trasparent overlay with fixed position (LEFT)","Standalone DIV inside a page"],300)

    dialog.addTextInput("layerDivID", "Layer <div> ID", layerDivID, 'MyLayer1')
    dialog.addHint("","This layer will be presented by standalone <div> with specified ID")

    dialog.addTextBox("layerComment", "Comments", layerComment, '')

    dialog.addSpace()

    //
    while (true) {
        // Cancel clicked
        if (!dialog.run()) break;

        // OK clicked
        // read data
        layerDivID = dialog.views['layerDivID'].stringValue() + ""
        layerComment = dialog.views['layerComment'].stringValue() + ""
        overlayType =  dialog.views['overlayType'].indexOfSelectedItem()

        // check data
        if (false) {
            continue
        }

        // save data    
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_DIV_ID, layerDivID)
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_OVERLAY_TYPE, overlayType)
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_COMMENT, layerComment)

        break

    }
    dialog.finish()

};

