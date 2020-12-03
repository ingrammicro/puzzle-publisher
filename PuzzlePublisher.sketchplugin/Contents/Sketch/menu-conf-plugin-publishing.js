@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";

@import "miro/api.js";
@import "miro/utils.js";

const UI = require('sketch/ui')

var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)

    UIDialog.setUp(context);

    let login = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN)
    if (login == undefined || login == null) login = ''
    let siteRoot = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT)
    if (siteRoot == undefined || siteRoot == null) siteRoot = ''
    let secret = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SECRET)
    if (secret == undefined || secret == null) secret = ''

    let sshPort = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SSH_PORT)
    if (sshPort == undefined || sshPort == null) sshPort = ''

    let miroEmail = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_EMAIL)
    if (miroEmail == undefined || miroEmail == null) miroEmail = ''
    let miroPassword = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_PASSWORD)
    if (miroPassword == undefined || miroPassword == null) miroPassword = ''

    let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
    if (commentsURL == undefined) commentsURL = ''
    let serverToolsPath = Settings.settingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH)
    if (serverToolsPath == undefined) serverToolsPath = ''
    let authorName = Settings.settingForKey(SettingKeys.PLUGIN_AUTHOR_NAME)
    if (authorName == undefined) authorName = ''


    const dialog = new UIDialog("Configure Publishing", NSMakeRect(0, 0, 500, 520), "Save", "Edit settings which are common for all documents.")

    dialog.addDivider()
    dialog.addLeftLabel("", "SFTP Server\nCredentials", 40)

    dialog.addTextInput("login", "Login", login, 'html@mysite.com:/var/www/html/', 350)
    dialog.addHint("loginHint", "SSH key should be uploaded to the site already")

    dialog.addTextInput("sshPort", "SSH Port", sshPort, '22', 350)

    dialog.addDivider()
    dialog.addLeftLabel("", "Miro Credentials", 40)
    dialog.addTextInput("miroEmail", "Email", miroEmail, 'user@gmail.com', 350)
    dialog.addSecureTextInput("miroPassword", "Password", miroPassword, '', 350)

    dialog.addDivider()
    dialog.addLeftLabel("", "Site Settings", 40)

    dialog.addTextInput("siteRoot", "Site Root URL", siteRoot, 'http://mysite.com', 350)
    dialog.addHint("siteRootHint", "Specify to open uploaded HTML in web browser automatically")
    dialog.addTextInput("serverToolsPath", "Relative URL to Server Tools", serverToolsPath, '/_tools/')
    dialog.addTextInput("secret", "Site Secret Key", secret, '', 350)

    dialog.addDivider()
    dialog.addLeftLabel("", "Author", 40)

    dialog.addTextInput("authorName", "Name", authorName, 'John Smith')
    //dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)


    let resultOk = false
    while (dialog.run()) {
        sshPort = dialog.views['sshPort'].stringValue() + ""
        if (sshPort != "") {
            let sshPortInt = parseInt(sshPort)
            if (isNaN(sshPortInt)) continue
            sshPort = sshPortInt + ""
        }
        // Check Miro
        miroEmail = dialog.views['miroEmail'].stringValue() + ""
        miroPassword = dialog.views['miroPassword'].stringValue() + ""
        if (('' != miroEmail && '' == miroPassword) || ('' == miroEmail && '' != miroPassword)) {
            UI.alert("Error", "Both Miro email and password should be empty or specified")
            continue
        }
        if ('' != miroPassword && '' != miroEmail) {
            if (!Utils.testMiro(context, miroEmail, miroPassword)) {
                continue
            }
        }
        //

        //Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.views['comments'].stringValue()+"")
        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN, dialog.views['login'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SSH_PORT, sshPort)

        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_EMAIL, miroEmail)
        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_PASSWORD, miroPassword)

        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT, dialog.views['siteRoot'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SECRET, dialog.views['secret'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH, dialog.views['serverToolsPath'].stringValue() + "")
        Settings.setSettingForKey(SettingKeys.PLUGIN_AUTHOR_NAME, dialog.views['authorName'].stringValue() + "")
        resultOk = true
        break
    }
    dialog.finish()

    if (resultOk) {
        // If connection to Miro specified then show a message
        if (miroEmail != "") {
            require('sketch/ui').alert('Success', 'Miro credentials have been verified successfully')
        }
    }
};