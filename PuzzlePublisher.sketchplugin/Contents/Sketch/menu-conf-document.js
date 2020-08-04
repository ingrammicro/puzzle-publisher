@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const doc = context.document
    const document = sketch.fromNative(doc)

    UIDialog.setUp(context);

    let customHideNavigation = Settings.documentSettingForKey(doc, SettingKeys.DOC_CUSTOM_HIDE_NAV)
    if (customHideNavigation == undefined) customHideNavigation = 0

    let customSortRule = Settings.documentSettingForKey(doc, SettingKeys.DOC_CUSTOM_SORT_RULE)
    if (customSortRule == undefined) customSortRule = -1 // use "plugin global" setting
    customSortRule++ // take care about the first "plugin global" option

    let backColor = Settings.documentSettingForKey(doc, SettingKeys.DOC_BACK_COLOR)
    if (backColor == undefined) backColor = ''

    let disableFixed = Settings.documentSettingForKey(doc, SettingKeys.DOC_DISABLE_FIXED_LAYERS) == 1

    let skipAutoSync = Settings.documentSettingForKey(doc, SettingKeys.DOC_SKIP_AUTOSYNC) == 1

    //
    const dialog = new UIDialog("Document Settings", NSMakeRect(0, 0, 500, 310), "Save", "Configure settings common for all document artboards. ")

    dialog.addLeftLabel("", "Export")
    dialog.addCheckbox("disableFixed", "Disable Fixed Layers", disableFixed)
    dialog.addHint("", "Fixed layers will be rendered as regular parts of an artboard.", 30)
    dialog.addCheckbox("skipAutoSync", "Disable auto sync with library", skipAutoSync)
    dialog.addHint("", "The document will not be synced with library during automation", 30)

    dialog.addDivider()
    dialog.addLeftLabel("", "Viewer")
    dialog.addSelect("customHideNavigation", "Navigation", customHideNavigation, ["(Use plugin setting)", "Visible", "Hidden"], 250)

    const sortOptions = Constants.SORT_RULE_OPTIONS.slice()
    sortOptions.splice(0, 0, "(Use plugin settings)")
    dialog.addSelect("customSortRule", "Artboards Sort Order", customSortRule, sortOptions, 250)
    dialog.addHint("", "Specify how artboards will sorted in HTML story.")

    dialog.addTextInput("backColor", "Custom Background Color", backColor, 'e.g. #FFFFFF')
    dialog.addHint("", "Default color is " + Constants.DEF_BACK_COLOR, 20)


    //
    if (dialog.run()) {
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_HIDE_NAV, dialog.views['customHideNavigation'].indexOfSelectedItem())
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_BACK_COLOR, dialog.views['backColor'].stringValue() + "")
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_DISABLE_FIXED_LAYERS, dialog.views['disableFixed'].state() == 1)
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_SKIP_AUTOSYNC, dialog.views['skipAutoSync'].state() == 1)

        let customSortRule = dialog.views['customSortRule'].indexOfSelectedItem()
        // skip back first "plugin global" option to use "custom" option
        customSortRule--
        Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_SORT_RULE, customSortRule)

    }
    dialog.finish()

};

