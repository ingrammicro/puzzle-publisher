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

    let vScrollType = Utils.getLayerSetting(layer, SettingKeys.LAYER_VSCROLL_TYPE, Constants.LAYER_VSCROLL_NONE)

    // create dialog
    const dialog = new UIDialog("Layer Settings", NSMakeRect(0, 0, 400, 320), "Save", "Configure selected layer options ")
    dialog.removeLeftColumn()

    dialog.addSelect("overlayType", "Overlay Mode", overlayType, ["Default (using \"Fix position\" setting)", "Trasparent overlay with fixed position (TOP)", "Trasparent overlay with fixed position (LEFT)"], 300)
    if (isFixed)
    {
        dialog.addSelect("fixedShadowType", "Fixed Layer Shadow Mode", fixedShadowType, ["Viewer shows a CSS-based shadow around the layer", "Sketch renders the layer shadow during export"], 300)
    }

    dialog.addSelect("vScrollType", "Vertical scrolling", vScrollType, ["None", "Enabled with default scrollbar behaviour", "Enabled with always visible scrollbar", "Enabled with always hidden scrollbar"], 300)
    if (layer.type === "Group")
    {
        dialog.addHint("vScrollTypeHint", "The layer needs to be masked")
    } else
    {
        dialog.addHint("vScrollTypeHint", "The layer should be group")
        dialog.enableControlByID('vScrollType', false)
    }


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

        Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_VSCROLL_TYPE, dialog.views['vScrollType'].indexOfSelectedItem())

        break

    }
    dialog.finish()

};

