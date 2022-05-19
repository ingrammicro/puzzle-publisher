@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context)
{
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    var UI = require('sketch/ui')
    const document = sketch.fromNative(context.document)
    var selection = document.selectedLayers
    var layers = selection.layers;

    UIDialog.setUp(context);

    // We need at least one layer
    if (layers.length != 1)
    {
        UI.alert("alert", "Select some single layer.")
        return
    }

    var layer = layers[0]
    if ('Artboard' == layer.type)
    {
        UI.alert("alert", "Select some single layer.")
        return
    }
    // read settings

    var layerComment = Settings.layerSettingForKey(layer, SettingKeys.LAYER_COMMENT)
    if (undefined == layerComment) layerComment = ""

    let overlayType = Settings.layerSettingForKey(layer, SettingKeys.LAYER_OVERLAY_TYPE)
    if (overlayType == undefined || overlayType == "")
        overlayType = SettingKeys.LAYER_OVERLAY_DEFAULT

    const isFixed = layer.sketchObject.isFixedToViewport()
    let fixedShadowType = undefined
    if (isFixed)
    {
        fixedShadowType = Settings.layerSettingForKey(layer, SettingKeys.LAYER_FIXED_SHADOW_TYPE)
        if (fixedShadowType == undefined) fixedShadowType = 0
    }

    let isVScroll = Utils.getLayerSetting(layer, SettingKeys.LAYER_VSCROLL_ON, false)

    // create dialog
    const dialog = new UIDialog("Layer Settings", NSMakeRect(0, 0, 400, 320), "Save", "Configure selected layer options ")
    dialog.removeLeftColumn()

    dialog.addSelect("overlayType", "Overlay Mode", overlayType, ["Default (using \"Fix position\" setting)", "Trasparent overlay with fixed position (TOP)", "Trasparent overlay with fixed position (LEFT)"], 300)
    if (isFixed)
    {
        dialog.addSelect("fixedShadowType", "Fixed Layer Shadow Mode", fixedShadowType, ["Viewer shows a CSS-based shadow around the layer", "Sketch renders the layer shadow during export"], 300)
    }

    const isVScrollControl = dialog.addCheckbox("isVScroll", "Enable vertical scrolling", isVScroll)
    dialog.addHint("isVScrollHint", "The layer needs to be masked")


    dialog.addTextBox("layerComment", "Comments", layerComment, '')

    dialog.addSpace()

    //
    while (true)
    {
        // Cancel clicked
        if (!dialog.run()) break;

        // OK clicked
        // read data
        layerComment = dialog.views['layerComment'].stringValue() + ""
        overlayType = dialog.views['overlayType'].indexOfSelectedItem()
        if (isFixed) fixedShadowType = dialog.views['fixedShadowType'].indexOfSelectedItem()


        // check data
        if (false)
        {
            continue
        }

        // save data    
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_OVERLAY_TYPE, overlayType)
        if (isFixed) Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_FIXED_SHADOW_TYPE, fixedShadowType)
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_COMMENT, layerComment)

        log(dialog.views['isVScroll'])
        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_VSCROLL_ON, dialog.views['isVScroll'].state() == 1)


        break

    }
    dialog.finish()

};

