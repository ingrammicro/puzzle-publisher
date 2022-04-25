@import "constants.js"
@import "exporter/exporter.js"
@import "lib/uidialog.js"
@import "lib/uipanel.js"
@import "lib/utils.js"


const Settings = require('sketch/settings')
const UI = require('sketch/ui')
const Dom = require('sketch/dom')


let exportInfo = {
    timeout: undefined,
    panel: undefined
}

function closePanel()
{
    if (exportInfo.panel != undefined)
    {
        exportInfo.panel.finish()
        exportInfo.panel = undefined
    }
    if (exportInfo.timeout != undefined)
    {
        exportInfo.timeout.cancel() // fibers takes care of keeping coscript around
        exportInfo.timeout = undefined
    }
    coscript.setShouldKeepAround(false)
}

function panelSwitchFinished()
{
    exportInfo.panel.addButton("cancel", "  Ok   ", function ()
    {
        closePanel()
    })
}

function openBrowser(currentPath, doc)
{
    const docName = doc.sketchObject.cloudName() + ""
    const openPath = currentPath + "/" + docName + "/"
    const fullPath = "" + openPath + (openPath.endsWith('/') ? '' : '/') + 'index.html'
    NSWorkspace.sharedWorkspace().openFile(fullPath);
}

function exportHTML(currentPath, nDoc, exportOptions, context)
{
    let fromCmd = ('fromCmd' in exportOptions) && exportOptions.fromCmd

    const currentPage = exportOptions.currentPage || nDoc.currentPage()
    new Exporter(currentPath, nDoc, currentPage, exportOptions, context);

    let exportedOk = false
    if (fromCmd)
    {
        exportedOk = exporter.exportArtboards()
        track(TRACK_EXPORT_COMPLETED)
    } else
    {
        let panel = new UIPanel("Exporting to HTML")
        exportInfo.panel = panel
        panel.addLabel("", "Please wait...")
        panel.show()

        // export HTML  
        coscript.setShouldKeepAround(true)

        exportInfo.timeout = coscript.scheduleWithInterval_jsFunction(1, function ()
        {

            // Exporting...
            exportedOk = exporter.exportArtboards()
            // 
            //panelSwitchFinished()
            closePanel()
            track(TRACK_EXPORT_COMPLETED)

            // show final message
            if (exporter.errors.length > 0)
            {
                UI.alert('Export failed with errors', exporter.errors.join("\n\n"))
            } else if (false && exporter.warnings.length > 0)
            {
                UI.alert('Export completed with warnings', exporter.warnings.join("\n\n"))
            } else
            {
                UI.message('HTML exported.')
                // open HTML in browser 
                if (!exportOptions.dontOpenBrowser)
                {
                    openBrowser(currentPath, Dom.fromNative(nDoc))
                }
            }
        })
    }
}


function saveDocumentAs(document, filePath)
{
    if (DEBUG) log(" SAVING DOCUMENT TO " + filePath)

    var newFileURL = NSURL.fileURLWithPath(filePath)
    document.sketchObject.writeToURL_ofType_forSaveOperation_originalContentsURL_error_(newFileURL, "com.bohemiancoding.sketch.drawing",
        NSSaveOperation, nil, nil);
}

function asyncExportHTML(context, doc, exportOptions)
{
    // Clone current doc to temp file
    const docName = doc.sketchObject.cloudName() + ""
    const tempDir = Utils.getPathToTempFolder()
    const tempFile = tempDir + "/" + "tmp" + ".sketch"
    saveDocumentAs(doc, tempFile)

    const fileManager = NSFileManager.defaultManager()
    const scriptName = "export.sh"

    const scriptPath = context.plugin.url().URLByAppendingPathComponent("Contents")
        .URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("scripts")
        .URLByAppendingPathComponent(scriptName)

    const newContext = {
        file: tempFile,
        name: docName,
        commands: "export,close",
        async: true,
        mode: exportOptions.mode,
        currentPageID: exportOptions.currentPage != undefined ? (exportOptions.currentPage.id + "") : undefined,
    }

    if (exportOptions.customArtboardHeight != "" && exportOptions.customArtboardWidth != "")
    {
        const customArtboardHeight = parseInt(exportOptions.customArtboardHeight)
        const customArtboardWidth = parseInt(exportOptions.customArtboardWidth)
        if (!isNaN(customArtboardHeight) && !isNaN(customArtboardWidth))
        {
            newContext.customArtboardHeight = customArtboardHeight
            newContext.customArtboardWidth = customArtboardWidth
        }
    }

    // Prepare options to send
    if (exportOptions.mode === undefined)
    {
    } else if (exportOptions.mode === Constants.EXPORT_MODE_SELECTED_ARTBOARDS)
    {
        const ids = exportOptions["selectedArtboards"].map(a => a.id).join(",")
        newContext.selectedArtboardIDS = ids
    }
    const newContextStr = JSON.stringify(newContext)

    // Run other Sketch instance to export    
    //const result = Utils.runCommand('/bin/bash', [scriptPath, tempDir, tempFile, docName, Utils.escapeDoudleQuote(JSON.stringify(exportOptions))], true)
    const result = Utils.runCommand('/bin/bash', [scriptPath, tempDir, tempFile, newContextStr], true)
    return result
}

function runExporter(context, exportOptions = null)
{

    if (exportOptions === null)
    {
        exportOptions = {
            cmd: 'exportHTML'
        }
    }

    const nDoc = exportOptions.nDoc ? exportOptions.nDoc : context.document
    const doc = Dom.fromNative(nDoc)
    const Settings = require('sketch/settings')

    let fromCmd = ('fromCmd' in exportOptions) && exportOptions.fromCmd

    const isCmdExportToHTML = exportOptions['cmd'] == "exportHTML"
    var dontOpenBrowser = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER) == 1
    var customWidth = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_CUSTOM_WIDTH) + ""
    var customHeight = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_CUSTOM_HEIGHT) + ""
    var askSize = Settings.settingForKey(SettingKeys.PLUGIN_ASK_CUSTOM_SIZE) == 1
    var compress = Settings.settingForKey(SettingKeys.PLUGIN_COMPRESS) == 1


    // ask for output path
    let currentPath = context.currentPath ? context.currentPath : Settings.settingForKey(SettingKeys.PLUGIN_EXPORTING_URL)
    if (currentPath == null)
    {
        // check legacy settings
        currentPath = Settings.documentSettingForKey(doc, SettingKeys.DOC_EXPORTING_URL)
        if (currentPath == null)
            currentPath = ''

    }

    if (!fromCmd)
    {
        UIDialog.setUp(context);

        const dialog = new UIDialog("Export to HTML", NSMakeRect(0, 0, 500, 100 + (askSize ? 100 : 0)), "Export")
        dialog.removeLeftColumn()


        dialog.addPathInput({
            id: "path", label: "Destination folder", labelSelect: "Select Folder",
            textValue: currentPath,
            inlineHint: 'e.g. ~/HTML', width: 450
        })
        dialog.addCheckbox("open", "Open HTML in browser", !dontOpenBrowser)
        if (askSize)
        {
            dialog.addTextInput("customWidth", "Artboard custom width (px)", customWidth + "", 'e.g. 1920')
            dialog.addTextInput("customHeight", "Artboard custom height (px)", customHeight + "", 'e.g. 1080')
        }

        track(TRACK_EXPORT_DIALOG_SHOWN)
        while (true)
        {
            const result = dialog.run()
            if (!result)
            {
                track(TRACK_EXPORT_DIALOG_CLOSED, { "cmd": "cancel" })
                return false
            }

            if (askSize)
            {
                customWidth = dialog.views['customWidth'].stringValue()
                if (customWidth != '')
                {
                    if (isNaN(customWidth)) continue
                } else
                    customWidth = ''

                customHeight = dialog.views['customHeight'].stringValue()
                if (customHeight != '')
                {
                    if (isNaN(customHeight)) continue
                } else
                    customHeight = ''

            }

            currentPath = dialog.views['path'].stringValue() + ""
            if (currentPath == "") continue

            dontOpenBrowser = dialog.views['open'].state() != 1
            compress = false //dialog.views['compress'].state() == 1


            break
        }
        dialog.finish()
        track(TRACK_EXPORT_DIALOG_CLOSED, { "cmd": "ok" })

        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORTING_URL, currentPath)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dontOpenBrowser)
        Settings.setSettingForKey(SettingKeys.PLUGIN_COMPRESS, compress)
        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_CUSTOM_WIDTH, customWidth)
        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_CUSTOM_HEIGHT, customHeight)

        exportOptions.dontOpenBrowser = dontOpenBrowser
        exportOptions.compress = compress
        if (customHeight !== "") exportOptions.customArtboardHeight = customHeight
        if (customWidth !== "") exportOptions.customArtboardWidth = customWidth

        // Export in background        
        var enabledJSON = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_DISABLE_INSPECTOR) != 1
        if (enabledJSON)
        {
            const result = asyncExportHTML(context, doc, exportOptions)
            if (result.result == 1)
            {
                if (!dontOpenBrowser) openBrowser(currentPath, doc)
            } else
            {
                UI.alert('Export failed with errors', result.output)
            }
            return
        }
    }


    exportHTML(currentPath, nDoc, exportOptions, context)

};
