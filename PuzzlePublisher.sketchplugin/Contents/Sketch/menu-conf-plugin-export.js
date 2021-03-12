@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";

const FILE_TYPES = ["PNG", "JPG"]



var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)
    const UI = require('sketch/ui')

    UIDialog.setUp(context);

    //let position = Settings.settingForKey(SettingKeys.PLUGIN_POSITION)
    //if (position == undefined || position == "") position = 0

    let sortRule = Settings.settingForKey(SettingKeys.PLUGIN_SORT_RULE)
    if (sortRule == undefined || sortRule == "") sortRule = 0

    let fontSizeFormat = Settings.settingForKey(SettingKeys.PLUGIN_FONTSIZE_FORMAT)
    if (fontSizeFormat == undefined || fontSizeFormat == "") fontSizeFormat = 0

    let fileTypeStr = Settings.settingForKey(SettingKeys.PLUGIN_FILETYPE)
    if (fileTypeStr == undefined || fileTypeStr == "") fileTypeStr = "PNG"
    let fileType = FILE_TYPES.indexOf(fileTypeStr)


    const dontRetina = Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES) == 1
    const disableZoom = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_ZOOM) == 1
    const hideNav = Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV) == 1
    const disableHotspots = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS) == 1
    const dontSaveElements = Settings.settingForKey(SettingKeys.PLUGIN_DONT_SAVE_ELEMENTS) == 1
    const askCustomSize = Settings.settingForKey(SettingKeys.PLUGIN_ASK_CUSTOM_SIZE) == 1
    const disableLibArtboards = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_DISABLE_LIB_ARTBOARDS) == 1


    let googleCode = Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
    if (googleCode == undefined) googleCode = ''
    let jsCode = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_JS_CODE)
    if (jsCode == undefined) jsCode = ''
    let shareiFrameSize = Settings.settingForKey(SettingKeys.PLUGIN_SHARE_IFRAME_SIZE)
    if (shareiFrameSize == undefined) shareiFrameSize = ''
    //


    const dialog = new UIDialog("Configure Export", NSMakeRect(0, 0, 500, 560), "Save", "Edit settings which are common for all documents")
    dialog.leftColWidth = 160


    dialog.addLeftLabel("", "Image Format")
    dialog.addSelect("fileType", "", fileType, ["PNG", "JPG"], 150)
    dialog.addCheckbox("retina", "Support Retina Displays", !dontRetina)


    dialog.addDivider()
    dialog.addLeftLabel("", "Artboards")

    dialog.addCheckbox("askCustomSize", "Ask custom artboard Size", askCustomSize)
    dialog.addCheckbox("disableLibArtboards", "Ignore library artboards", disableLibArtboards)
    //dialog.addSelect("position", "Position on Browser Page", position, ["Default (Top)", "Top", "Center"], 150)
    //dialog.addHint("", "Specify how artboard will be aligned in browser page")

    dialog.addSelect("sortRule", "Artboards Sort Order", sortRule, Constants.SORT_RULE_OPTIONS, 250)
    dialog.addHint("", "Specify how artboards will sorted in HTML story.")

    dialog.addDivider()
    dialog.addLeftLabel("", "Viewer")

    dialog.addCheckbox("zoom", "Enable auto-scale", !disableZoom)
    dialog.addCheckbox("hidenav", "Show navigation", !hideNav)
    dialog.addCheckbox("disableHotspots", "Highlight hotspots on mouse over", !disableHotspots)
    dialog.addTextInput("jsCode", "Custom JS Code", jsCode, 'e.g. alert("Hello")')
    dialog.addTextInput("googleCode", "Google Code", googleCode, 'e.g. UA-XXXXXXXX-X')
    dialog.addTextInput("shareiFrameSize", "Embed Code iFrame Size", shareiFrameSize)
    dialog.addHint("", "Use width:height format")


    dialog.addDivider()
    dialog.addLeftLabel("", "Element Inspector")
    dialog.addCheckbox("dontSaveElements", "Disable Element Inspector", dontSaveElements)

    const fontSizeOptions = Constants.FONTSIZE_FORMAT_OPTIONS.slice()
    fontSizeOptions.splice(0, 0, "Default (" + fontSizeOptions[0] + ")")
    dialog.addSelect("fontSizeFormat", "Font Size Format", fontSizeFormat, fontSizeOptions, 250)
    dialog.addHint("", "Specify how font size will diplayed in Element Inspector.")

    if (dialog.run()) {
        //Settings.setSettingForKey(SettingKeys.PLUGIN_POSITION, dialog.views['position'].indexOfSelectedItem())
        Settings.setSettingForKey(SettingKeys.PLUGIN_SORT_RULE, dialog.views['sortRule'].indexOfSelectedItem())
        Settings.setSettingForKey(SettingKeys.PLUGIN_FONTSIZE_FORMAT, dialog.views['fontSizeFormat'].indexOfSelectedItem())
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES, dialog.views['retina'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_ZOOM, dialog.views['zoom'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_GOOGLE_CODE, dialog.views['googleCode'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_JS_CODE, dialog.views['jsCode'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_SHARE_IFRAME_SIZE, dialog.views['shareiFrameSize'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_HIDE_NAV, dialog.views['hidenav'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS, dialog.views['disableHotspots'].state() != 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_SAVE_ELEMENTS, dialog.views['dontSaveElements'].state() == 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_ASK_CUSTOM_SIZE, dialog.views['askCustomSize'].state() == 1)
        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_DISABLE_LIB_ARTBOARDS, dialog.views['disableLibArtboards'].state() == 1)

        // convert position in FILE_TYPES to file type string
        fileType = dialog.views['fileType'].indexOfSelectedItem()
        Settings.setSettingForKey(SettingKeys.PLUGIN_FILETYPE, FILE_TYPES[fileType])
    }
    dialog.finish()

};

