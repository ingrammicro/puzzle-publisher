@import "constants.js"
@import "exporter/exporter.js"
@import "lib/uidialog.js"
@import "lib/uipanel.js"
@import "lib/utils.js"


const Settings = require('sketch/settings')
const UI = require('sketch/ui')

let exportInfo = {
    timeout: undefined,
    panel: undefined
}

function closePanel() {
    if (exportInfo.panel != undefined) {
        exportInfo.panel.finish()
        exportInfo.panel = undefined
    }
    if (exportInfo.timeout != undefined) {
        exportInfo.timeout.cancel() // fibers takes care of keeping coscript around
        exportInfo.timeout = undefined
    }
    coscript.setShouldKeepAround(false)
}

function panelSwitchFinished() {
    exportInfo.panel.addButton("cancel", "  Ok   ", function () {
        closePanel()
    })
}

function exportHTML(currentPath, nDoc, exportOptions, context) {
    let fromCmd = ('fromCmd' in exportOptions) && exportOptions.fromCmd

    new Exporter(currentPath, nDoc, nDoc.currentPage(), exportOptions, context);

    if (fromCmd) {
        exporter.exportArtboards()
    } else {
        let panel = new UIPanel("Exporting to HTML")
        exportInfo.panel = panel
        panel.addLabel("", "Please wait...")
        panel.show()

        // export HTML  
        coscript.setShouldKeepAround(true)

        exportInfo.timeout = coscript.scheduleWithInterval_jsFunction(1, function () {

            // Exporting...
            let exportedOk = exporter.exportArtboards()
            if (exportedOk) {
                // open HTML in browser 
                if (!exportOptions.dontOpenBrowser) {
                    const openPath = currentPath + "/" + exporter.docName + "/"
                    const fullPath = "" + openPath + (openPath.endsWith('/') ? '' : '/') + 'index.html'
                    NSWorkspace.sharedWorkspace().openFile(fullPath);
                    //log('open: '+fullPath)
                    /*const openResult = Utils.runCommand('/usr/bin/open', [openPath,openPath+'/index.html'])
                    
                    if(openResult.result){
                    }else{
                        UI.alert('Can not open HTML in browser', openResult.output)
                    }*/
                }
            }

            // 
            //panelSwitchFinished()
            closePanel()

            // show final message
            if (exporter.errors.length > 0) {
                UI.alert('Export failed with errors', exporter.errors.join("\n\n"))
            } else if (false && exporter.warnings.length > 0) {
                UI.alert('Export completed with warnings', exporter.warnings.join("\n\n"))
            } else {
                UI.message('HTML exported.')
            }
        })
    }
}


function announce11() {
    UI.alert('11.0.0 released',
        "Hello from Puzzle Publisher plugin creators.\n\
This is a one-time message. You can view it again via \"Show last announcement\" in the plugin menu.\n\
\n\
The latest 11.0.0 release brings full support for the Sketch Smart Layouts feature. \n\
To implement this support we have re-written all code related to processing of symbol instances overrides. We have actually dropped most of this code.\n\
\n\
Currently during the export Publisher detaches all symbol instances from master thus allowing Sketch to apply all transformations itself.\n\
Of course right after export Publisher undoes these detachments.\n\
\n\
Positive effects:\n\
- Full support for any layer transformations\n\
- Export time reduced by 20%\n\
\n\
Current limitation:\n\
Links attached directly to symbol instances can be ignored some cases. The best solution would be adding a hotspot inside a symbol master and linking it.\n\
\n\
Important note:\n\
In case the export fails and Published displays an execution error undoing detachments would probably fail too. To fix this just manually select Undo from Edit menu of Sketch.\n\
\n\
Thanks for your attention\n\
Puzzle Publisher team.")
}

function runExporter(context, exportOptions = null) {
    if (null == exportOptions) {
        exportOptions = {
            cmd: 'exportHTML'
        }
    }

    let fromCmd = ('fromCmd' in exportOptions) && exportOptions.fromCmd

    const Dom = require('sketch/dom')
    const nDoc = exportOptions.nDoc ? exportOptions.nDoc : context.document
    const doc = Dom.fromNative(nDoc)
    const Settings = require('sketch/settings')


    const isCmdExportToHTML = exportOptions['cmd'] == "exportHTML"
    var dontOpen = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER) == 1
    var compress = Settings.settingForKey(SettingKeys.PLUGIN_COMPRESS) == 1


    // ask for output path
    let currentPath = context.currentPath ? context.currentPath : Settings.settingForKey(SettingKeys.PLUGIN_EXPORTING_URL)
    if (currentPath == null) {
        // check legacy settings
        currentPath = Settings.documentSettingForKey(doc, SettingKeys.DOC_EXPORTING_URL)
        if (currentPath == null)
            currentPath = ''

    }

    let customWidth = ''
    let customHeight = ''


    if (!fromCmd) {
        UIDialog.setUp(context);

        // show special message about 11 version
        if (Settings.settingForKey(SettingKeys.PLUGIN_INFO_11) != 1) {
            announce11()
            Settings.setSettingForKey(SettingKeys.PLUGIN_INFO_11, 1)
        }

        const dialog = new UIDialog("Export to HTML", NSMakeRect(0, 0, 500, 200), "Export")

        dialog.addPathInput({
            id: "path", label: "Destination folder", labelSelect: "Select Folder",
            textValue: currentPath,
            inlineHint: 'e.g. ~/HTML', width: 450
        })
        //dialog.addCheckbox("compress","Compress images", compress)
        dialog.addCheckbox("open", "Open HTML in browser", !dontOpen)
        dialog.addTextInput("customWidth", "Artboard custom width (px)", customWidth + "", 'e.g. 1920')
        dialog.addTextInput("customHeight", "Artboard custom height (px)", customHeight + "", 'e.g. 1080')


        while (true) {
            const result = dialog.run()
            if (!result) return

            customWidth = dialog.views['customWidth'].stringValue()
            if (customWidth != '') {
                if (isNaN(customWidth)) continue
            } else
                customWidth = ''

            customHeight = dialog.views['customHeight'].stringValue()
            if (customHeight != '') {
                if (isNaN(customHeight)) continue
            } else
                customHeight = ''

            currentPath = dialog.views['path'].stringValue() + ""
            if (currentPath == "") continue

            dontOpen = dialog.views['open'].state() != 1
            compress = false //dialog.views['compress'].state() == 1


            break
        }

        dialog.finish()

        Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORTING_URL, currentPath)
        Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dontOpen)
        Settings.setSettingForKey(SettingKeys.PLUGIN_COMPRESS, compress)
    }


    exportOptions.dontOpen = dontOpen
    exportOptions.compress = compress
    exportOptions.customArtboardHeight = customHeight
    exportOptions.customArtboardWidth = customWidth


    exportHTML(currentPath, nDoc, exportOptions, context)

};
