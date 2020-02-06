@import("constants.js")

var showChangeLog = function (context) {
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(Constants.SITE_CHANGELOG_URL))
};