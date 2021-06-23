@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const doc = context.document
    const document = sketch.fromNative(doc)

    UIDialog.setUp(context);

    let customHideNavigation = Utils.getDocSetting(doc, SettingKeys.DOC_CUSTOM_HIDE_NAV, 0)
    let customSortRule = Utils.getDocSetting(doc, SettingKeys.DOC_CUSTOM_SORT_RULE, -1) // 0 - use "plugin global" setting
    customSortRule++ // take care about the first "plugin global" option
    let customFontSizeFormat = Utils.getDocSetting(doc, SettingKeys.DOC_CUSTOM_FONTSIZE_FORMAT, 0)// 0 - use "plugin global" setting
    let backColor = Utils.getDocSetting(doc, SettingKeys.DOC_BACK_COLOR)
    let DOC_OWNER_NAME = Utils.getDocSetting(doc, SettingKeys.DOC_OWNER_NAME)
    let DOC_OWNER_EMAIL = Utils.getDocSetting(doc, SettingKeys.DOC_OWNER_EMAIL)
    let disableFixed = Utils.getDocSetting(doc, SettingKeys.DOC_DISABLE_FIXED_LAYERS, undefined) == 1
    let skipAutoSync = Utils.getDocSetting(doc, SettingKeys.DOC_SKIP_AUTOSYNC, undefined) == 1

    //
    const dialog = new UIDialog("Document Settings", NSMakeRect(0, 0, 500, 520), "Save", "Configure settings common for all document artboards. ")

    dialog.addLeftLabel("", "Export")
    dialog.addCheckbox("disableFixed", "Render fixed layers as regular", disableFixed)
    dialog.addCheckbox("skipAutoSync", "Disable auto sync with library", skipAutoSync)
    dialog.addHint("", "The document will not be synced with library during automation", 30)

    dialog.addDivider()
    dialog.addLeftLabel("", "Viewer")
    dialog.addSelect("customHideNavigation", "Navigation", customHideNavigation, ["(Use plugin setting)", "Visible", "Hidden"], 250)

    const sortOptions = Constants.SORT_RULE_OPTIONS.slice()
    sortOptions.splice(0, 0, "(Use plugin settings)")
    dialog.addSelect("customSortRule", "Artboards Sort Order", customSortRule, sortOptions, 250)
    dialog.addHint("", "Specify how artboards will sorted in HTML story.")

    const customFontSizeOptions = Constants.FONTSIZE_FORMAT_OPTIONS.slice()
    customFontSizeOptions.splice(0, 0, "(Use plugin settings)")
    dialog.addSelect("customFontSizeFormat", "Font Size Inspector Format", customFontSizeFormat, customFontSizeOptions, 250)
    dialog.addHint("", "Specify how font size will diplayed in Element Inspector.")

    dialog.addTextInput("backColor", "Custom Background Color", backColor, 'e.g. #FFFFFF')
    dialog.addHint("", "Default color is " + Constants.DEF_BACK_COLOR, 20)

    dialog.addDivider()
    dialog.addLeftLabel("", "Document Owner")
    dialog.addTextInput("DOC_OWNER_NAME", "Name", DOC_OWNER_NAME, 'John Smith')
    dialog.addHint("", "Leave empty to use global plugin settings", 20)
    dialog.addTextInput("DOC_OWNER_EMAIL", "Email", DOC_OWNER_EMAIL, 'john@smith.com')

    //
    if (dialog.run()) {
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_HIDE_NAV, dialog.views['customHideNavigation'].indexOfSelectedItem())
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_BACK_COLOR, dialog.views['backColor'].stringValue() + "")
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_OWNER_NAME, dialog.views['DOC_OWNER_NAME'].stringValue() + "")
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_OWNER_EMAIL, dialog.views['DOC_OWNER_EMAIL'].stringValue() + "")
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_DISABLE_FIXED_LAYERS, dialog.views['disableFixed'].state() == 1)
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_SKIP_AUTOSYNC, dialog.views['skipAutoSync'].state() == 1)

        let customSortRule = dialog.views['customSortRule'].indexOfSelectedItem()
        // skip back first "plugin global" option to use "custom" option
        customSortRule--
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_SORT_RULE, customSortRule)

        let customFontSizeFormat = dialog.views['customFontSizeFormat'].indexOfSelectedItem()
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_FONTSIZE_FORMAT, customFontSizeFormat)

    }
    dialog.finish()

};

