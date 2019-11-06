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
    dialog.enableControlByID('overlayPin',
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
    handleOverlayPin()
}

function handleOverlayPin(){
    var selectedTypeIndex =  dialog.views['artboardType'].indexOfSelectedItem()
    var selectedPinIndex =  dialog.views['overlayPin'].indexOfSelectedItem()    
    const enabled = Constants.ARTBOARD_TYPE_OVERLAY == selectedTypeIndex

    dialog.overlayPositions.forEach(function(positions,pinIndex){
        const hidden = pinIndex != selectedPinIndex
        const imageView = dialog.views[ "overlayAlignImage-"+pinIndex ]
        imageView.hidden = hidden           
        positions.forEach(function(label,index){
            const radioControl = dialog.views[ "overlayAlignRadio-"+pinIndex+"-"+index ]
            radioControl.hidden = hidden
            radioControl.enabled = enabled
        })
    })
    
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

    let oldOverlayAlign = Settings.layerSettingForKey(artboard,SettingKeys.OLD_ARTBOARD_OVERLAY_ALIGN)
    let overlayPin = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN)
    let overlayPinHotspot = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN_HOTSPOT)
    let overlayPinPage = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN_PAGE)
    if(undefined==overlayPin){
        const newValues = Utils.upgradeArtboardOverlayPosition(oldOverlayAlign)
        overlayPin = newValues.pinTo
        overlayPinHotspot = newValues.hotspotTo
        overlayPinPage = newValues.pageTo     
    }
    
    ///////////////// CREATE DIALOG ///////////////////////
    dialog = new UIDialog("Artboard Settings", NSMakeRect(0, 0, 430, 450), "Save", "Configure exporting options for the selected artboard. ")
    dialog.initTabs(["General","Overlay"])

    /////////////////////////// PAGE 1

    const types = ["Regular page","Modal Dialog","External URL Page","Overlay"]
    const typeControl = dialog.addSelect("artboardType","Artboard Type", artboardType,types,250)
    typeControl.setCOSJSTargetFunction(enableTypeRelated)

    const enableShadowControl = dialog.addCheckbox("enableShadow", "Show modal dialog or overlay shadow", enableShadow)
    dialog.addHint("enableShadowHint","Dim a previous artboard to set visual focus on an modal.")
    
    dialog.addSpace()

    const enableAutoScrollControl = dialog.addCheckbox("enableAutoScroll", "Scroll browser page to top", enableAutoScroll)
    dialog.addHint("enableAutoScrollHint","The artboard will be scrolled on top after showing")

    const transNextSecsControl = dialog.addTextInput("transNextSecs", "Delay for autotranstion to next screen (Secs)", transNextSecs, '', 60)
    dialog.addHint("transNextSecsHint", "Go to the next page auto the delay (0.001 - 60 secs)")

    /////////////////////////// PAGE 2

    dialog.setTabForViewsCreating(1)

    const overlayByEventControl = dialog.addSelect("overlayByEvent","Show Overlay On", overlayByEvent,["Click","Mouse Over"],250)
    ///
    const overlayPins = [
        {name:"Hotspot",id: "overlay_pin_hotspot_position",selectedIndex: overlayPinHotspot},
        {name:"Page",id: "overlay_pin_page_position",selectedIndex: overlayPinPage}
    ]
    const overlayPinControl = dialog.addSelect("overlayPin","Pin Overlay To", overlayPin,overlayPins.map(value=>value.name),250)
    overlayPinControl.setCOSJSTargetFunction(handleOverlayPin)

    ////
    dialog.overlayPositions = [
        ["Under hotspot from left corner to right","Under hostpot on center","Under hotspot from right corner to left",
        "From hotspot top left corner","From hotspot top center","From hotspot top right corner",
        "To the right of the bottom right corner of hotspot"],
        ["Page top left","Page top center","Page top right",        
        "Page bottom left","Page bottom center","Page bottom right",
        "Page center"]
    ]
    dialog.addLabel("overlayAlignLabel","Overlay Position")
    var overlayAlignControlRadios = []
    const imageWidth = 342
    const imageHeight = 164
    const radioWidth = 20
    const radioHeight = 18
    const xDelta = 100
    const yDelta = 65
    const hSpace = 10
    var orgFrame = dialog.getNewFrame(radioHeight,radioWidth)

    dialog.overlayPositions.forEach(function(positions,pinIndex){
        var frame = Utils.copyRect(orgFrame)
        const pin = overlayPins[pinIndex]
        //
        const imageName  = "artboard_layerposition_"+pinIndex + "@2x.png"
        var image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed(imageName).path())
        const imageFrame = Utils.copyRect(orgFrame)
        imageFrame.origin.y -= imageHeight - radioHeight
        imageFrame.size.width = imageWidth
        imageFrame.size.height = imageHeight
        const imageView = dialog.addImage("overlayAlignImage-"+pinIndex,image,imageFrame)
        imageView.hidden = true
        //        
        dialog.startRadioButtions(pin.id,pin.selectedIndex)
        //
        positions.forEach(function(label,index){
            const radioControl = dialog.addRadioButton( "overlayAlignRadio-"+pinIndex+"-"+index," ",index,frame)
            radioControl.toolTip = label
            overlayAlignControlRadios.push(radioControl)
            frame.origin.x += radioWidth
            radioControl.hidden = true
            //
            if((index+1)%3 === 0){
                frame.origin.x = dialog.leftOffset
                frame.origin.y -= yDelta
            }else{
                frame.origin.x += xDelta
            }

        },context)
    },context)

    dialog.y -= imageHeight
    ///
    const overlayOverFixedControl = dialog.addCheckbox("overlayOverFixed", "Show overlay over fixed panels", overlayOverFixed)
    const overlayAlsoFixedControl = dialog.addCheckbox("overlayAlsoFixed", "Show overlay as fixed panel if called from fixed panel", overlayAlsoFixed)

    enableTypeRelated()    
    //var image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path())
    //dialog.addImage(image, NSMakeRect(50, 50, 100, 100))
    
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
        if(overlayPinControl.isEnabled){
            Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN, overlayPinControl.indexOfSelectedItem())    
            Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN_HOTSPOT, dialog.views['overlay_pin_hotspot_position'].selectedIndex)    
            Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_OVERLAY_PIN_PAGE, dialog.views['overlay_pin_page_position'].selectedIndex)    
        }
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

