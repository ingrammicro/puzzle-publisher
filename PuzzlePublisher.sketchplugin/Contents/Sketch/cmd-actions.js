@import "lib/ga.js";
@import "lib/utils.js";
@import "constants.js";

function onStartup(context) {
    const Settings = require('sketch/settings')

    const installedBefore = Settings.settingForKey(SettingKeys.PLUGIN_INSTALLED)
    if (!installedBefore) {
        track(TRACK_INSTALLED)
        Settings.setSettingForKey(SettingKeys.PLUGIN_INSTALLED, 1)
    } else {
        track(TRACK_STARTED)
    }
}