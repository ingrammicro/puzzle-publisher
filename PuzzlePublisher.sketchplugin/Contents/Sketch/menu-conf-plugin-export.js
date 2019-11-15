@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)
    const UI = require('sketch/ui')

    UIDialog.setUp(context);

    let position = Settings.settingForKey(SettingKeys.PLUGIN_POSITION)
    if (position == undefined || position == "") position = 0

    let sortRule = Settings.settingForKey(SettingKeys.PLUGIN_SORT_RULE)
    if (sortRule == undefined || sortRule == "") sortRule = 0

    const dontRetina = Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES) == 1
    const disableZoom = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_ZOOM) == 1
    const hideNav = Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV) == 1
    const disableHotspots = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS) == 1
    const dontSaveElements = Settings.settingForKey(SettingKeys.PLUGIN_DONT_SAVE_ELEMENTS) == 1

    let googleCode = Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
    if (googleCode == undefined) googleCode = ''
    let shareiFrameSize = Settings.settingForKey(SettingKeys.PLUGIN_SHARE_IFRAME_SIZE)
    if (shareiFrameSize == undefined) shareiFrameSize = ''
    //


    const dialog = new UIDialog("Configure Export", NSMakeRect(0, 0, 500, 450), "Save", "Edit settings which are common for all documents.")


    dialog.addLeftLabel("", "Export")
    dialog.addCheckbox("retina", "Export Retina images", !dontRetina)
    dialog.addCheckbox("dontSaveElements", "Don't save data for Element Inspector", dontSaveElements)
    dialog.addTextInput("googleCode", "Google Code", googleCode, 'e.g. UA-XXXXXXXX-X')

    dialog.addDivider()
    dialog.addLeftLabel("", "Artboards")

    dialog.addSelect("position", "Position on Browser Page", position, ["Default (Top)", "Top", "Center"], 150)
    dialog.addHint("", "Specify how artboard will be aligned in browser page")

    dialog.addSelect("sortRule", "Artboards Sort Order", sortRule, Constants.SORT_RULE_OPTIONS, 250)
    dialog.addHint("", "Specify how artboards will sorted in HTML story.")

    dialog.addDivider()
    dialog.addLeftLabel("", "Viewer")

    dialog.addCheckbox("zoom", "Enable auto-scale", !disableZoom)
    dialog.addCheckbox("hidenav", "Show navigation", !hideNav)
    dialog.addCheckbox("disableHotspots", "Highlight hotspots on mouse over", !disableHotspots)

    dialog.addDivider()
    dialog.addLeftLabel("", "Show Embed\nCode", 40)
    dialog.addTextInput("shareiFrameSize", "iFrame Size", shareiFrameSize, 'e.g. 400:225')
    dialog.addHint("", "Use width:height format")

    if (dialog.run()) {
        Settings.setSettingForKey(SettingKeys.PLUGIN_POSITION, dialog.views['position'].indexOfSelectedItem())
        Settings.setSettingForKey(SettingKeys.PLUGIN_SORT_RULE, dialog.views['sortRule'].indexOfSelectedItem())
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES, dialog.views['retina'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_ZOOM, dialog.views['zoom'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_GOOGLE_CODE, dialog.views['googleCode'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_SHARE_IFRAME_SIZE, dialog.views['shareiFrameSize'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_HIDE_NAV, dialog.views['hidenav'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS, dialog.views['disableHotspots'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_SAVE_ELEMENTS, dialog.views['dontSaveElements'].state() == 1)
    }
    dialog.finish()

};

