@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)
    const UI = require('sketch/ui')

    UIDialog.setUp(context);

    // Read settings
    let logDebug = Settings.settingForKey(SettingKeys.PLUGIN_LOGDEBUG_ENABLED) == 1
    let gaEnabled = !Settings.settingForKey(SettingKeys.PLUGIN_GA_DISABLED)

    // Build dialog
    const dialog = new UIDialog("Configure", NSMakeRect(0, 0, 400, 200), "Save", "Edit Puzzle Publisher common configuration settings.")

    dialog.addCheckbox("logDebug", "Enable debug logging", logDebug)

    dialog.addDivider()
    dialog.addLeftLabel("", "Privacy", 40)
    dialog.addCheckbox("gaEnabled", "Share analytics with PT developer", gaEnabled)
    dialog.addHint("gaEnabledHint", "Help improve Puzzle Publisher by automatically sending usage data. Usage data is collected anonymously and cannot be used to identify you.", 40)

    // Run event loop
    while (true) {
        const result = dialog.run()
        if (!result) {
            dialog.finish()
            return false
        }
        logDebug = dialog.views['logDebug'].state() == 1
        gaEnabled = dialog.views['gaEnabled'].state() == 1

        break
    }
    dialog.finish()

    // Save updated settings
    Settings.setSettingForKey(SettingKeys.PLUGIN_LOGDEBUG_ENABLED, logDebug)
    Settings.setSettingForKey(SettingKeys.PLUGIN_GA_DISABLED, !gaEnabled)

    return true

};

