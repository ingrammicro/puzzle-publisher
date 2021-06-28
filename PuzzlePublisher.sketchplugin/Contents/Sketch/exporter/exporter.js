@import("constants.js")
@import("lib/utils.js")
@import("lib/ga.js")
@import("exporter/exporter-build-html.js")
@import("exporter/PZLayer.js")
@import("exporter/PZArtboard.js")
@import("exporter/PZPage.js")
@import("exporter/PZDoc.js")
@import("exporter/publisher.js") // we need it to run resize.sh script
@import("tokens/DSExporter.js")

var exporter = undefined


class Exporter {

    constructor(selectedPath, ndoc, page, exportOptions, context) {
        this.Settings = require('sketch/settings');
        this.Sketch = require('sketch/dom');
        this.ndoc = ndoc
        this.doc = this.Sketch.fromNative(ndoc)
        this.page = page;
        this.context = context;
        this.customArtboardFrame = undefined
        this.enableTransitionAnimation = false
        this.siteIconLayer = undefined
        this.myLayers = []
        this.errors = []
        this.warnings = []

        // workaround for Sketch 52s
        this.docName = this._clearCloudName(this.ndoc.cloudName() + "")
        let posSketch = this.docName.indexOf(".sketch")
        if (posSketch > 0) {
            this.docName = this.docName.slice(0, posSketch)
        }
        // @workaround for Sketch 52

        this.initPaths(selectedPath)

        this.exportOptions = exportOptions
        this._readSettings()


        this.filterAster = null == this.exportOptions || !('mode' in this.exportOptions) || Constants.EXPORT_MODE_SELECTED_ARTBOARDS != this.exportOptions.mode

        // init global variable
        exporter = this
    }

    _readSettings() {
        if (this.exportOptions.customArtboardWidth > 0 || this.exportOptions.customArtboardHeight > 0) {
            this.customArtboardFrame = new Rectangle(0, 0
                , parseInt(this.exportOptions.customArtboardWidth, 10)
                , parseInt(this.exportOptions.customArtboardHeight, 10)
            )
        }

        this.retinaImages = this.Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES) != 1
        this.enabledJSON = this.Settings.settingForKey(SettingKeys.PLUGIN_DONT_SAVE_ELEMENTS) != 1
        this.disableFixedLayers = this.customArtboardFrame || this.Settings.documentSettingForKey(this.doc, SettingKeys.DOC_DISABLE_FIXED_LAYERS) == 1

        let pluginSortRule = this.Settings.settingForKey(SettingKeys.PLUGIN_SORT_RULE)
        if (undefined == pluginSortRule) pluginSortRule = Constants.SORT_RULE_X
        const docCustomSortRule = this.Settings.documentSettingForKey(this.doc, SettingKeys.DOC_CUSTOM_SORT_RULE)
        this.sortRule = undefined == docCustomSortRule || docCustomSortRule < 0 ? pluginSortRule : docCustomSortRule

        let fontSizeFormat = this.Settings.settingForKey(SettingKeys.PLUGIN_FONTSIZE_FORMAT)
        const docCustomFontSize = this.Settings.documentSettingForKey(this.doc, SettingKeys.DOC_CUSTOM_FONTSIZE_FORMAT)
        if (undefined != docCustomFontSize && docCustomFontSize != 0) fontSizeFormat = docCustomFontSize
        this.fontSizeFormat = undefined != fontSizeFormat ? fontSizeFormat - 1 : Constants.FONT_SIZE_FORMAT_SKETCH

        let backColor = this.Settings.documentSettingForKey(this.doc, SettingKeys.DOC_BACK_COLOR)
        if (undefined == backColor) backColor = ""
        this.backColor = backColor

        let serverTools = this.Settings.settingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH)
        if (serverTools == undefined) serverTools = ''
        this.serverTools = serverTools

        let fileType = Settings.settingForKey(SettingKeys.PLUGIN_FILETYPE)
        if (fileType == undefined || fileType == "") fileType = "PNG"
        this.fileType = fileType.toLowerCase()

        // To know do we need full-size images or not
        const miroEnabled = Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_MIRO_ENABLED) == 1
        this.exportFullImages = miroEnabled || true

        this.ignoreLibArtboards = this.Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_DISABLE_LIB_ARTBOARDS) == 1
    }

    getManifest() {
        var manifestPath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("manifest.json").path()
        return NSJSONSerialization.JSONObjectWithData_options_error(NSData.dataWithContentsOfFile(manifestPath), 0, nil)

    }


    logMsg(msg) {
        const d = new Date()
        log(d.getHours() + ":" + d.getMinutes() + "." + d.getSeconds() + " " + msg)
    }


    logWarning(text) {
        this.logMsg("[ WARNING ] " + text)
        this.warnings.push(text)
    }

    logError(error) {
        this.logMsg("[ ERROR ] " + error)
        this.errors.push(error)
    }

    stopWithError(error) {
        const UI = require('sketch/ui')
        UI.alert('Error', error)
        exit = true
    }

    _clearCloudName(cloudName) {
        let name = cloudName
        let posSketch = name.indexOf(".sketch")
        if (posSketch > 0) {
            name = name.slice(0, posSketch)
        }
        return name
    }

    getTokensExporter() {
        if (undefined == this.tokensExporter) {
            this.tokensExporter = new DSExporter(this.context)
            this.tokensExporter.initForPublisher()
        }
        return this.tokensExporter
    }

    prepareFilePath(filePath, fileName) {
        const fileManager = NSFileManager.defaultManager();
        const targetPath = filePath + '/' + fileName;

        let error = MOPointer.alloc().init();
        if (!fileManager.fileExistsAtPath(filePath)) {
            if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(filePath, true, null, error)) {
                this.logError("prepareFilePath(): Can't create directory '" + filePath + "'. Error: " + error.value().localizedDescription());
                return undefined
            }
        }

        if (fileManager.fileExistsAtPath(targetPath)) {
            if (!fileManager.removeItemAtPath_error(targetPath, error)) {
                this.logError("prepareFilePath(): Can't remove old directory '" + targetPath + "'. Error: " + error.value().localizedDescription());
                return undefined
            }
        }
        return targetPath
    }


    copyStatic(resFolder) {
        const fileManager = NSFileManager.defaultManager();
        const targetPath = this.prepareFilePath(this._outputPath, resFolder);
        if (undefined == targetPath) return false

        const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(resFolder)
        //const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(resFolder).path();        

        let error = MOPointer.alloc().init();
        if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
            this.logMsg(error.value().localizedDescription());
            return this.logError("copyStatic(): Can't copy '" + sourcePath + "' to directory '" + targetPath + "'. Error: " + error.value().localizedDescription());
        }

        return true
    }

    startStoryData() {
        const disableHotspots = this.Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS) == 1

        var ownerName = Utils.getDocSetting(this.ndoc, SettingKeys.DOC_OWNER_NAME)
        if ('' == ownerName) ownerName = Utils.getPluginSetting(SettingKeys.PLUGIN_AUTHOR_NAME)
        var ownerEmail = Utils.getDocSetting(this.ndoc, SettingKeys.DOC_OWNER_EMAIL)
        if ('' == ownerEmail) ownerEmail = Utils.getPluginSetting(SettingKeys.PLUGIN_AUTHOR_EMAIL)

        this.storyData = {
            docName: Utils.toFilename(this.docName),
            docPath: "P_P_P",
            docVersion: Constants.DOCUMENT_VERSION_PLACEHOLDER,
            ownerName: ownerName,
            ownerEmail: ownerEmail,
            authorName: Constants.DOCUMENT_AUTHOR_NAME_PLACEHOLDER,
            authorEmail: Constants.DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER,
            commentsURL: Constants.DOCUMENT_COMMENTS_URL_PLACEHOLDER,
            hasRetina: this.retinaImages,
            serverToolsPath: this.serverTools,
            fontSizeFormat: this.fontSizeFormat,
            fileType: this.fileType,
            disableHotspots: disableHotspots,
            zoomEnabled: this.Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_ZOOM) != 1,
            title: this.docName,
            layersExist: this.enabledJSON,
            centerContent: this.Settings.settingForKey(SettingKeys.PLUGIN_POSITION) === Constants.POSITION_CENTER),
            highlightLinks: false,
            pages: [],
            groups: []
        }
        //
    }

    createMainHTML() {
        const buildOptions = {
            docName: this.docName,
            serverTools: this.serverTools,
            backColor: this.backColor,
            centerContent: this.Settings.settingForKey(SettingKeys.PLUGIN_POSITION) === Constants.POSITION_CENTER,
            loadLayers: this.enabledJSON,
            cssFileNames: this.enabledJSON ? this.mDoc.getCSSIncludes() : undefined,
            enableAnimations: this.enableTransitionAnimation,
        }


        const docHideNav = this.Settings.documentSettingForKey(this.doc, SettingKeys.DOC_CUSTOM_HIDE_NAV)
        buildOptions.hideNav = docHideNav == undefined || docHideNav == 0 ? this.Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV) == 1 : docHideNav == 2

        let googleCode = this.Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
        if (googleCode == undefined) googleCode = ''
        buildOptions.googleCode = googleCode
        let jsCode = this.Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_JS_CODE)
        if (jsCode == undefined) jsCode = ''
        buildOptions.jsCode = jsCode

        if ("" == buildOptions.backColor) buildOptions.backColor = Constants.DEF_BACK_COLOR

        const s = buildMainHTML(buildOptions);

        const filePath = this.prepareFilePath(this._outputPath, 'index.html');
        if (undefined == filePath) return false

        Utils.writeToFile(s, filePath);
        return true
    }



    compressImages() {
        if (!this.exportOptions.compress) return true

        this.logMsg(" compressImages: running...")
        const pub = new Publisher(this.context, this.ndoc);
        pub.copyScript("compress2.sh")
        var url = pub.context.plugin.urlForResourceNamed('advpng').path()
        const res = pub.runScriptWithArgs("compress2.sh", [this.imagesPath, url])
        if (!res.result) {
            this.logMsg(" compressImages: failed!")
        } else
            this.logMsg(" compressImages: done!")

        pub.showOutput(res)
    }

    buildPreviews() {
        this.logMsg(" buildPreviews: running...")
        // WE NEED THE FOLLOWING DUMMY CODE TO GET UNDO CHANGES ( see PZDoc.undoChanges() )
        const pub = new Publisher(this.context, this.ndoc);
        let args = ["-Z", "300", "fileName", "--out", this.imagesPath + "previews/"]
        let res = pub.runToolWithArgs("/usr/bin/sips", args)

        this.logMsg(" buildPreviews: done!!!!!")
    }

    createViewerFile(fileName, folder = Constants.VIEWER_DIRECTORY) {
        return this.prepareFilePath(this._outputPath + "/" + folder, fileName);
    }

    // result: true OR false
    finishSaveStoryData() {
        const iFrameSizeSrc = this.Settings.settingForKey(SettingKeys.PLUGIN_SHARE_IFRAME_SIZE)
        let iFrameSize = undefined
        if (iFrameSizeSrc != undefined && iFrameSizeSrc != '') {
            const size = iFrameSizeSrc.split(':')
            if (2 == size.length) {
                iFrameSize = {
                    width: size[0],
                    height: size[1]
                }
            }
        }

        this.storyData['startPageIndex'] = this.mDoc.startArtboardIndex
        this.storyData['totalImages'] = this.mDoc.totalImages
        if (undefined != iFrameSize) {
            this.storyData['iFrameSizeWidth'] = iFrameSize.width
            this.storyData['iFrameSizeHeight'] = iFrameSize.height
        }
        if ("" != this.backColor) {
            this.storyData['backColor'] = this.backColor
        }

        // Convert data to JSON
        let jsStory = "var story = " + JSON.stringify(this.storyData, null, ' ')

        // And save it
        const pathStoryJS = this.createViewerFile('story.js')
        if (undefined == pathStoryJS) return false
        Utils.writeToFile(jsStory, pathStoryJS)
        return true
    }



    exportArtboards() {
        this.logMsg("exportArtboards: running...")

        // Prepare folders
        this.prepareOutputFolder()

        // Copy static files
        if (!this.copyStatic("resources")) return false
        if (!this.copyStatic("viewer")) return false

        this.mDoc = new PZDoc()
        try {
            // Collect layers information
            this.mDoc.collectData()
            this.mDoc.buildLinks()


            // Build main HTML file
            if (!this.createMainHTML()) return false

            // Build Story.js with hotspots  
            this.startStoryData();
            // Export every artboard into image
            this.mDoc.export()
            if (!this.finishSaveStoryData()) return false

            // Compress Images
            this.compressImages()

            // Build image small previews for Gallery
            this.buildPreviews()

            // Save site icon
            if (this.siteIconLayer != undefined) {
                this.siteIconLayer.exportSiteIcon()
            }

            // Dump document layers to JSON file
            this.saveToJSON()
        }
        catch (error) {
            this.logError(error)
        }
        finally {
            if (DEBUG) exporter.logMsg("exportArtboards: undo changes")
            this.mDoc.undoChanges()

        }

        this.logMsg("exportArtboards: done!")

        return true
    }

    saveToJSON() {
        if (!this.enabledJSON) return true

        const symbolData = this.mDoc.getSymbolData()
        const json = this.mDoc.getJSON()

        const pathJSFile = this.createViewerFile('LayersData.js')
        if (!Utils.writeToFile(symbolData + "var layersData = " + json, pathJSFile)) return false

    }


    initPaths(selectedPath) {
        this._outputPath = selectedPath + "/" + this.docName
        this.imagesPath = this._outputPath + "/" + Constants.IMAGES_DIRECTORY;
        this.fullImagesPath = this.imagesPath + Constants.FULLIMAGE_DIRECTORY
        this.previewsImagePath = this.imagesPath + Constants.PREVIEWS_DIRECTORY
    }


    prepareOutputFolder() {
        Utils.deleteFile(this._outputPath)

        function createSubfolder(path) {
            let error = MOPointer.alloc().init();
            const fileManager = NSFileManager.defaultManager();
            if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, false, null, error)) {
                exporter.logMsg(error.value().localizedDescription());
            }
        }

        createSubfolder(this.previewsImagePath)
        createSubfolder(this.fullImagesPath)

    }
}
