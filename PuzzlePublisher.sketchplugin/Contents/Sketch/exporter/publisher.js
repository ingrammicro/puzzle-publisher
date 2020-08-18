@import("constants.js")
@import("lib/utils.js")
@import("lib/ga.js")
@import("lib/uidialog.js")

@import "miro/api.js";
@import "miro/utils.js";

let publisher = null

Api.prototype.artboardsToPNG = function (context, exportAll, scale) {
    var imagePath = publisher.mockupsPath + "/images/"
    var exportInfoList = [];
    const Dom = require('sketch/dom')
    const jDoc = Dom.fromNative(publisher.doc)

    log("Miro: build page list: start")
    for (var page of publisher.story.pages) {
        const artboard = jDoc.getLayerWithID(page["id"])
        var exportInfo = { "artboardID": page["id"], "artboard": artboard.sketchObject, "path": imagePath + page['image2x'] };
        exportInfoList.push(exportInfo);
    }
    log("Miro: build page list: done")
    return exportInfoList;
}

class Publisher {
    constructor(context, doc) {
        this.doc = doc;
        this.UI = require('sketch/ui')
        this.context = context;
        this.Settings = require('sketch/settings');

        this.login = ''
        this.sshPort = ''
        this.siteRoot = ''
        this.ver = ''
        this.remoteFolder = ''

        this.allMockupsdDir = this.Settings.settingForKey(SettingKeys.PLUGIN_EXPORTING_URL)
        this.serverToolsPath = this.Settings.settingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH) + ""
        this.authorName = this.Settings.settingForKey(SettingKeys.PLUGIN_AUTHOR_NAME) + ""

        this.message = ""
        publisher = this

        this.story = null
        this.mockupsPath = ''
    }


    log(msg) {
        //log(msg)
    }

    publish() {

        this.readOptions()

        // Show this.UI
        if (!this.context.fromCmd) {
            while (true) {
                if (!this.askOptions()) return false
                if (this.checkOptions()) break
            }
        }

        let version = this.ver
        let destFolder = this.remoteFolder
        if ('' == destFolder) return true
        // drop trailed /
        destFolder = destFolder.replace(/(\/)$/, "")

        // copy publish script
        if (!this.copyScript("publish.sh")) {
            return false
        }


        let docFolder = this.doc.cloudName();
        let posSketch = docFolder.indexOf(".sketch")
        if (posSketch > 0) {
            docFolder = docFolder.slice(0, posSketch)
        }

        // 
        if (this.miroEmail != "" && this.miroBoard != "") {
            this.publishToMiro()
        }

        // run publish script
        let commentsID = destFolder
        commentsID = Utils.toFilename(commentsID)
        const runResult = this.runPublishScript(version, this.allMockupsdDir, docFolder, destFolder, commentsID)

        track(TRACK_PUBLISH_COMPLETED)
        // success
        if (runResult.result) {
            const openURL = this.siteRoot + destFolder + (version == "-1" ? "" : ("/" + version)) + "/index.html"
            const announceFolder = destFolder + (version == "-1" ? "" : ("/" + version))

            // save changed document
            log(" SAVING DOCUMENT...")
            const Dom = require('sketch/dom')
            const jDoc = Dom.fromNative(this.doc)
            jDoc.save(err => {
                if (err) {
                    log(" Failed to save a document. Error: " + err)
                }
            })
            // inform server about new version
            if (this.message != "--" && this.serverToolsPath != "") {
                try {
                    var url = this.siteRoot + this.serverToolsPath + Constants.SERVER_ANNOUNCE_SCRIPT
                    url += "?author=" + encodeURI(this.authorName).replace(/[#]/g, '')
                    if ("" != this.secret) url += "&sec=" + encodeURI(this.secret).replace(/[#]/g, '')
                    url += "&msg=" + encodeURI(this.message).replace(/[#]/g, '')
                    url += "&ver=" + encodeURI(this.ver).replace(/[#]/g, '')
                    url += "&dir=" + encodeURI(announceFolder).replace(/[#]/g, '')
                    if ('--NOTELE' == this.message) {
                        url += "&NOTELE=1"
                    }
                    var nURL = NSURL.URLWithString(url);
                    var data = NSData.dataWithContentsOfURL(nURL);
                    //var json = NSJSONSerialization.JSONObjectWithData_options_error(data, 0, nil)
                    //log(json)
                } catch (e) {
                    log("Exception: " + e);
                }
            }
            if (!this.context.fromCmd) {
                // open browser                
                if (this.siteRoot != '') {
                    const openResult = Utils.runCommand('/usr/bin/open', [openURL])
                    if (openResult.result) {
                    } else {
                        this.UI.alert('Can not open HTML in browser', openResult.output)
                    }
                }
                this.showMessage(runResult)
            }
        } else {
            this.showMessage(runResult)
            return false
        }

        return true
    }

    publishToMiro() {
        let miroBoard = this.miroBoard
        log("publishToMiro: start")

        //  Get token
        var token = api.getToken();
        if (!token) return false
        log("publishToMiro: got token")

        // Get request
        var response = api.authCheckRequest(this.context);
        if (response) {
            if (response.success == 1) {

            } else if (response.error && response.error.code == 401) {
                api.setToken(nil);
                log(response.error)
                this.UI.alert('Error', "Can not publish to Miro")
                return false
            } else {
                dealWithErrors(context, 'Something went wrong.');
                return false
            }
        }
        log("publishToMiro: established connect")

        // Get board ID
        const boards = api.getBoards()
        const found = boards.find(el => el.title == miroBoard)
        if (!found) {
            this.UI.alert('Error', "Can not find '" + miroBoard + "' board in Miro")
            return false
        }
        const boardId = found['boardId']

        this.mockupsPath = "/Users/baza/Ingram/Generated Mockups/Project HX"

        // Load story.js file and eval it
        const storyPath = this.mockupsPath + "/viewer/story.js"
        let storyJS = Utils.readFile(storyPath).replace("var story = {", "this.story = {")
        storyJS = storyJS.replaceAll("$.extend(new ViewerPage(),", "").replaceAll("})", "}")
        eval(storyJS)

        // Publish
        log("publishToMiro: strart publishing")
        api.uploadArtboardsToRTB(this.context, boardId, true)

        log("publishToMiro: done")

    }


    showMessage(result) {
        if (result.result) {
            this.UI.alert('Success', PublishKeys.SHOW_OUTPUT ? result.output : 'Mockups published!')
        } else {
            this.showOutput(result)
        }
    }

    showOutput(result) {
        if (result.result && !PublishKeys.SHOW_OUTPUT) return true
        this.UI.alert(result.result ? 'Output' : 'Error', result.output)
    }

    checkOptions() {
        if (this.ver == '') {
            this.UI.alert('Error', 'Version should be specified')
            return false
        }
        if (this.login == '') {
            this.UI.alert('Error', 'SFTP login should be specified')
            return false
        }
        if (this.remoteFolder == '') {
            this.UI.alert('Error', 'Remote site folder should be specified')
            return false
        }
        return true
    }


    readOptions() {
        // read current version from document settings
        let Settings = this.Settings

        this.ver = Settings.documentSettingForKey(this.doc, SettingKeys.DOC_PUBLISH_VERSION)
        if (this.ver == undefined || this.ver == null) this.ver = '1'

        this.login = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN)
        if (this.login == undefined || this.login == null) this.login = ''

        this.sshPort = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SSH_PORT)
        if (this.sshPort == undefined || this.sshPort == null || this.sshPort == '') this.sshPort = '22'


        this.siteRoot = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT)
        if (this.siteRoot == undefined || this.siteRoot == null) this.siteRoot = ''

        this.secret = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SECRET)
        if (this.secret == undefined || this.secret == null) this.secret = ''

        this.remoteFolder = Settings.documentSettingForKey(this.doc, SettingKeys.DOC_PUBLISH_REMOTE_FOLDER)
        if (this.remoteFolder == undefined || this.remoteFolder == null) this.remoteFolder = ''

        this.miroBoard = Settings.settingForKey(SettingKeys.DOC_PUBLISH_MIRO_BOARD)
        if (this.miroBoard == undefined || this.miroBoard == null) this.miroBoard = ''

        this.miroEmail = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_EMAIL)
        if (this.miroEmail == undefined || this.miroEmail == null) this.miroEmail = ''
    }

    askOptions() {
        let Settings = this.Settings

        let askLogin = '' == this.login
        let askSiteRoot = '' == this.siteRoot
        let askMessage = '' != this.serverToolsPath
        let askMiro = '' != this.miroEmail

        // show dialod        
        const dialog = new UIDialog("Publish HTML", NSMakeRect(0, 0, 400,
            180 + (askMessage ? 65 : 0) + (askLogin ? 60 : 0) + (askSiteRoot ? 60 : 0) + (askMiro ? 60 : 0)),
            "Publish", "Generated HTML will be uploaded to external site by SFTP.")
        dialog.removeLeftColumn()

        if (askMessage) {
            dialog.addTextBox("message", "Change Description", this.message, 'Added Remove button', 40)
            dialog.addHint("messageHint", "Describe briefly was changed")
        }

        dialog.addTextInput("version", "Version", this.ver, '1')
        dialog.addHint("versionHint", "Exporter will publish two HTML sets - live and <version>")

        dialog.addTextInput("remoteFolder", "Remote Site Folder", this.remoteFolder, 'myprojects/project1', 350)
        dialog.addHint("remoteFolderHint", "Relative path on server")

        if (askLogin) {
            dialog.addTextInput("login", "SFTP Login", this.login, 'html@mysite.com:/var/www/html/', 350)
            dialog.addHint("loginHint", "SSH key should be uploaded to the site already")
        }

        if (askSiteRoot) {
            dialog.addTextInput("siteRoot", "Site Root URL (Optional)", this.siteRoot, 'http://mysite.com', 350)
            dialog.addHint("siteRootHint", "Specify to open uploaded HTML in web browser automatically")
        }

        if (askMiro) {
            dialog.addTextInput("miroBoard", "Miro board", this.miroBoard, 'Board name (optional)', 350)
        }


        track(TRACK_PUBLISH_DIALOG_SHOWN)
        while (true) {
            const result = dialog.run()
            if (!result) {
                track(TRACK_PUBLISH_DIALOG_CLOSED, { "cmd": "cancel" })
                return false
            }

            if (askLogin) {
                this.login = dialog.views['login'].stringValue() + ""
            }

            if (askSiteRoot) {
                this.siteRoot = dialog.views['siteRoot'].stringValue() + ""
            }
            if (askMiro) {
                this.miroBoard = dialog.views['miroBoard'].stringValue() + ""
            }

            this.remoteFolder = dialog.views['remoteFolder'].stringValue() + ""

            if (askMessage) {
                this.message = dialog.views['message'].stringValue() + ""
            }

            let ver = dialog.views['version'].stringValue() + ""
            let verInt = parseInt(ver)
            this.ver = ver

            // check data
            if ('' == this.remoteFolder) continue
            if ('' == this.ver) continue
            if (askMessage && '' == this.message) continue

            if (askMiro && this.miroBoard != '') {
                // Check board
                const boards = api.getBoards()
                const found = boards.find(el => el.title == this.miroBoard)
                if (!found) {
                    UI.alert("Error", "No such board in Miro")
                    continue
                }
            }

            dialog.finish()
            track(TRACK_PUBLISH_DIALOG_CLOSED, { "cmd": "ok" })
            // save new version into document settings         
            if (askSiteRoot) {
                Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT, this.siteRoot)
            }
            if (askMiro) {
                Settings.setSettingForKey(SettingKeys.DOC_PUBLISH_MIRO_BOARD, this.miroBoard)
            }

            Settings.setDocumentSettingForKey(this.doc, SettingKeys.DOC_PUBLISH_REMOTE_FOLDER, this.remoteFolder)
            Settings.setDocumentSettingForKey(this.doc, SettingKeys.DOC_PUBLISH_VERSION, (verInt >= 0 ? verInt + 1 : verInt) + "")
            return true
        }
        return false


    }

    runPublishScript(version, allMockupsdDir, docFolder, remoteFolder, commentsID) {
        let args = [version, allMockupsdDir, docFolder, remoteFolder, commentsID]
        args.push(this.login)
        args.push(this.sshPort)
        //args.push(Constants.MIRROR2)        
        return this.runScriptWithArgs("publish.sh", args)
    }


    runScriptWithArgs(scriptName, args) {
        const scriptPath = this.allMockupsdDir + "/" + scriptName
        args.unshift(scriptPath) // add script itself as a first argument
        const res = Utils.runCommand('/bin/bash', args)

        // delete script
        Utils.deleteFile(scriptPath)

        return res
    }

    runToolInResourcesWithArgs(toolName, args) {
        var url = this.context.plugin.urlForResourceNamed(toolName).path()
        //args.unshift(toolName)
        //const regex = / /gi;
        //const pathTo = this._getFilePathInResourceFolder(toolName).replace(regex,"\\ ")
        const res = Utils.runCommand(url, args)
        return res
    }

    runToolWithArgs(toolName, args) {
        const res = Utils.runCommand(toolName, args)
        return res
    }


    copyScript(scriptName) {

        const scriptPath = this.allMockupsdDir + "/" + scriptName

        const fileManager = NSFileManager.defaultManager()
        const targetPath = scriptPath

        // delete old copy
        Utils.deleteFile(targetPath)

        let sourcePath = this._getFileURLInResourceFolder(scriptName)
        let error = MOPointer.alloc().init()

        if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
            log("copyScript(): Can't copy '" + sourcePath + "' to '" + targetPath + "'. Error: " + error.value().localizedDescription());

            this.UI.alert('Can`t copy script', error.value().localizedDescription())
            return false
        }

        return true
    }


    _getFileURLInResourceFolder(file) {
        return this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(PublishKeys.RESOURCES_FOLDER).URLByAppendingPathComponent(file)
    }
}
