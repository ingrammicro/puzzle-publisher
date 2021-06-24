@import "lib/utils.js";
@import "constants.js";

function jsonToQueryString(json) {
    return Object.keys(json)
        .map(function (key) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
        })
        .join("&");
}

function _completeGA(d, r, e) {
    if (DEBUG) log("Completed GA")
}



function track(page, props = undefined) {
    coscript.scheduleWithInterval_jsFunction(1, function () {

        var trackingId = Constants.GA_ID

        var Settings = require("sketch/settings");
        var kUUIDKey = "google.analytics.uuid";
        var uuid = null
        var uuid = NSUserDefaults.standardUserDefaults().objectForKey(kUUIDKey);
        if (!uuid) {
            uuid = NSUUID.UUID().UUIDString();
            NSUserDefaults.standardUserDefaults().setObject_forKey(uuid, kUUIDKey)
        }

        var variant = ""//MSApplicationMetadata.metadata().variant;
        var source =
            "Sketch " +
            (variant == "NONAPPSTORE" ? "" : variant + " ") +
            Settings.version.sketch;


        if (Settings.settingForKey(SettingKeys.PLUGIN_GA_DISABLED)) {
            // the user didn't enable sharing analytics
            return 'the user didn\'t enable sharing analytics';
        }

        var payload = {
            v: 1,
            tid: trackingId,
            ds: source,
            cid: uuid,
            t: "pageview",
            dp: page
        };

        if (typeof __command !== "undefined") {
            payload.an = __command.pluginBundle().name();
            payload.aid = __command.pluginBundle().identifier();
            payload.av = __command.pluginBundle().version();
        }

        if (props) {
            Object.keys(props).forEach(function (key) {
                payload[key] = props[key];
            });
        }

        var nURL = NSURL.URLWithString(
            "https://www.google-analytics.com/collect?payload_data&" +
            jsonToQueryString(payload) +
            "&z=" +
            NSUUID.UUID().UUIDString()
        );
        if (DEBUG) log("Started GA " + nURL)
        //NSData.dataWithContentsOfURL(nURL);
        let session = NSURLSession.sharedSession()
        //let task = [session dataTaskWithURL: nURL completionHandler: _completeGA]//, _completeGA)
        //let task = session.dataTaskWithURL_completionHandler_(nURL, _completeGA)
        let task = session.dataTaskWithURL(nURL)
        task.resume()
    })
}
