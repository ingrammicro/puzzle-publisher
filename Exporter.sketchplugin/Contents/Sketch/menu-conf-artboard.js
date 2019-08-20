@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";

var dialog = undefined

function enableTypeRelated(){
    var selectedIndex =  dialog.views['artboardType'].indexOfSelectedItem()

    dialog.enableControlByID('enableShadow',
        Constants.ARTBOARD_TYPE_MODAL==selectedIndex || Constants.ARTBOARD_TYPE_OVERLAY ==selectedIndex
    )
    dialog.enableControlByID('overlayByEvent',
        Constants.ARTBOARD_TYPE_OVERLAY ==selectedIndex
    )    
    dialog.enableControlByID('overlayAlign',
        Constants.ARTBOARD_TYPE_OVERLAY ==selectedIndex
    )
    dialog.enableControlByID('overlayOverFixed',
        Constants.ARTBOARD_TYPE_OVERLAY ==selectedIndex
    )    
    dialog.enableControlByID('overlayAlsoFixed',
        Constants.ARTBOARD_TYPE_OVERLAY == selectedIndex
    )  
    dialog.enableControlByID('enableAutoScroll',
        Constants.ARTBOARD_TYPE_REGULAR == selectedIndex || Constants.ARTBOARD_TYPE_MODAL == selectedIndex
    )
    dialog.enableControlByID('transNextSecs',
        Constants.ARTBOARD_TYPE_EXTERNAL_URL != selectedIndex
    )
    
}

var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)
    const selection = document.selectedLayers

    UIDialog.setUp(context);

    // We need the only one artboard
    if (selection.length != 1 || selection.layers[0].type != 'Artboard') {
        const UI = require('sketch/ui')
        UI.alert("Alert", "Select a single artboard.")
        return
    }
    const artboard = selection.layers[0]

    ///////////////// READ SETTINGS ///////////////////////
    const enabledModal = Settings.layerSettingForKey(artboard, SettingKeys.LEGACY_ARTBOARD_MODAL) == 1
    let artboardType = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_TYPE)
    if (artboardType == undefined || artboardType == "") {
        if (enabledModal) // take legacy settings
            artboardType = Constants.ARTBOARD_TYPE_MODAL
        else
            artboardType = 0
    }

    let enableShadow = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_SHADOW)
    if( undefined == enableShadow ){
        const enableModalShadow =  Settings.layerSettingForKey(artboard, SettingKeys.LEGACY_ARTBOARD_MODAL_SHADOW)
        if(undefined!=enableModalShadow && Constants.ARTBOARD_TYPE_MODAL==artboardType){
            enableShadow = enableModalShadow
        }else{
            enableShadow = true
        }
    }

    const overlayOverFixed = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED) == 1 

    let overlayAlsoFixed = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED)
    overlayAlsoFixed = (overlayAlsoFixed!=undefined)?overlayAlsoFixed==1:true
    
    const enableAutoScroll = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL) != 1


    let transNextSecs = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
    if (undefined == transNextSecs) transNextSecs = ""


    let overlayByEvent = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_BY_EVENT)
    if (overlayByEvent == undefined || overlayByEvent == "") {
        overlayByEvent = 0
    }
    let overlayAlign = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_ALIGN)
    if (overlayAlign == undefined)  overlayAlign = 0

    ///////////////// CREATE DIALOG ///////////////////////
    dialog = new UIDialog("Artboard Settings", NSMakeRect(0, 0, 370, 450), "Save", "Configure exporting options for the selected artboard. ")

    const types = ["Regular page","Modal Dialog","External URL Page","Overlay"]
    const typeControl = dialog.addComboBox("artboardType","Artboard Type", artboardType,types,250)
    typeControl.setCOSJSTargetFunction(enableTypeRelated)

    const enableShadowControl = dialog.addCheckbox("enableShadow", "Show modal dialog or overlay shadow", enableShadow)
    dialog.addHint("enableShadowHint","Dim a previous artboard to set visual focus on an modal.")
    
    const overlayByEventControl = dialog.addComboBox("overlayByEvent","Show Overlay On", overlayByEvent,["Click","Mouse Over"],250)
    dialog.addHint("overlayByEventHint","Setup how links to this overlay will be executed") 

    const positions = [
        "Under hotspot from left corner to right","Under hostpot on center","Under hotspot from right corner to left",
        "Page top left corner","Page top center","Page top right corner",
        "Page center",
        "Page bottom left","Page bottom center","Page bottom right",
        "Hotspot top left corner","Hotspot top center","Hotspot top right corner",
        "To the right of the top right corner of hotspot"
    ]
    const overlayAlignControl = dialog.addComboBox("overlayAlign","Overlay Position", overlayAlign,positions,250)
    const overlayOverFixedControl = dialog.addCheckbox("overlayOverFixed", "Show overlay over fixed panels", overlayOverFixed)
    const overlayAlsoFixedControl = dialog.addCheckbox("overlayAlsoFixed", "Show overlay as fixed panel if called from fixed panel", overlayAlsoFixed)

    dialog.addSpace()

    const enableAutoScrollControl = dialog.addCheckbox("enableAutoScroll", "Scroll browser page to top", enableAutoScroll)
    dialog.addHint("enableAutoScrollHint","The artboard will be scrolled on top after showing")

    const transNextSecsControl = dialog.addTextInput("transNextSecs", "Delay for autotranstion to next screen (Secs)", transNextSecs, '', 60)
    dialog.addHint("transNextSecsHint","Go to the next page auto the delay (0.001 - 60 secs)")

    enableTypeRelated()
    
     ///////////////// RUN EVENT LOOP ///////////////////////
    while (true) {
        // Cancel clicked
        if (!dialog.run()) break;

        // OK clicked
        // read data
        transNextSecs = transNextSecsControl.stringValue() + ""
        artboardType =  typeControl.indexOfSelectedItem()
 
        // check data        
        if (transNextSecs != '' && isNaN(parseFloat(transNextSecs))) {
            continue
        }   

        // save data

        Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_TYPE, artboardType)    
        if(overlayByEventControl.isEnabled)
            Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_BY_EVENT, overlayByEventControl.indexOfSelectedItem())    
        if(overlayAlignControl.isEnabled)
            Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_ALIGN, overlayAlignControl.indexOfSelectedItem())    
        if(enableShadowControl.isEnabled) 
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_SHADOW, enableShadowControl.state() == 1)
        if(overlayOverFixedControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED, overlayOverFixedControl.state() == 1)
        if(overlayAlsoFixedControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED, overlayAlsoFixedControl.state() == 1)            
        if(enableAutoScrollControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL, enableAutoScrollControl.state() != 1)
        if(transNextSecsControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS, transNextSecs)

        break

    }
    dialog.finish()

};

