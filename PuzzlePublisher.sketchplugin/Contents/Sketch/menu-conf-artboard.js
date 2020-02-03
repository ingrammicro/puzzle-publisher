@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";

var dialog = undefined

function enableTypeRelated() {
    var selectedIndex = dialog.views['artboardType'].indexOfSelectedItem()

    const isOverlay = Constants.ARTBOARD_TYPE_OVERLAY == selectedIndex

    dialog.enableControlByID('enableShadow',
        Constants.ARTBOARD_TYPE_MODAL == selectedIndex || Constants.ARTBOARD_TYPE_OVERLAY == selectedIndex
    )
    dialog.enableTextByID('overlayAlignLabel', isOverlay)
    dialog.enableTextByID('overlayFixedLabel', isOverlay)
    dialog.enableControlByID('overlayByEvent', isOverlay)
    dialog.enableControlByID('overlayPin', isOverlay)
    dialog.enableControlByID('overlayOverFixed', isOverlay)
    dialog.enableControlByID('overlayAlsoFixed', isOverlay)
    dialog.enableControlByID('overlayClosePrevOverlay', isOverlay)
    dialog.enableControlByID('enableAutoScroll',
        Constants.ARTBOARD_TYPE_REGULAR == selectedIndex || Constants.ARTBOARD_TYPE_MODAL == selectedIndex
    )
    dialog.enableControlByID('transNextSecs',
        Constants.ARTBOARD_TYPE_EXTERNAL_URL != selectedIndex
    )
    handleOverlayPin()
}

function handleOverlayPin() {
    var selectedTypeIndex = dialog.views['artboardType'].indexOfSelectedItem()
    var selectedPinIndex = dialog.views['overlayPin'].indexOfSelectedItem()
    const enabled = Constants.ARTBOARD_TYPE_OVERLAY == selectedTypeIndex

    dialog.overlayPositions.forEach(function (positions, pinIndex) {
        const hidden = pinIndex != selectedPinIndex
        const imageView = dialog.views["overlayAlignImage-" + pinIndex]
        imageView.hidden = hidden
        positions.forEach(function (label, index) {
            const radioControl = dialog.views["overlayAlignRadio-" + pinIndex + "-" + index]
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
        // 
        //
        const l = selection.layers[0]
        Settings.setLayerSettingForKey(l, "zzzz", "1234")
        //
        const UI = require('sketch/ui')
        UI.alert("Alert", "Select a single artboard.")
        return
    }
    const artboard = selection.layers[0]

    ///////////////// READ SETTINGS ///////////////////////
    const enabledModal = Settings.layerSettingForKey(artboard, SettingKeys.LEGACY_ARTBOARD_MODAL) == 1
    let artboardType = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_TYPE)
    if (artboardType == undefined || artboardType == "") {
        if (enabledModal) // take legacy settings
            artboardType = Constants.ARTBOARD_TYPE_MODAL
        else
            artboardType = 0
    }

    let enableShadow = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_SHADOW)
    if (undefined == enableShadow) {
        const enableModalShadow = Settings.layerSettingForKey(artboard, SettingKeys.LEGACY_ARTBOARD_MODAL_SHADOW)
        if (undefined != enableModalShadow && Constants.ARTBOARD_TYPE_MODAL == artboardType) {
            enableShadow = enableModalShadow
        } else {
            enableShadow = true
        }
    }

    const overlayOverFixed = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED) == 1
    let overlayAlsoFixed = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED)
    overlayAlsoFixed = (overlayAlsoFixed != undefined) ? overlayAlsoFixed == 1 : true
    const overlayClosePrevOverlay = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_CLOSE_PREVOVERLAY) == 1

    const enableAutoScroll = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL) != 1

    let transNextSecs = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
    if (undefined == transNextSecs) transNextSecs = ""

    let transAnimType = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_ANIM_TYPE)
    if (undefined == transAnimType) transAnimType = Constants.ARTBOARD_TYPE_OVERLAY == artboardType ?
        Constants.ARTBOARD_TRANS_ANIM_FADE :
        Constants.ARTBOARD_TRANS_ANIM_NONE


    let overlayByEvent = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_BY_EVENT)
    if (overlayByEvent == undefined || overlayByEvent == "") {
        overlayByEvent = 0
    }

    let oldOverlayAlign = Settings.layerSettingForKey(artboard, SettingKeys.OLD_ARTBOARD_OVERLAY_ALIGN)
    let overlayPin = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN)
    let overlayPinHotspot = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN_HOTSPOT)
    let overlayPinPage = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN_PAGE)
    if (undefined == overlayPin) {
        const newValues = Utils.upgradeArtboardOverlayPosition(oldOverlayAlign)
        overlayPin = newValues.pinTo
        overlayPinHotspot = newValues.hotspotTo
        overlayPinPage = newValues.pageTo
    }

    ///////////////// CREATE DIALOG ///////////////////////
    dialog = new UIDialog("Artboard Settings", NSMakeRect(0, 0, 480, 450), "Save", "Configure exporting options for the selected artboard. ")
    dialog.initTabs(["General", "Overlay", "Transitions"])

    /////////////////////////// PAGE 1
    dialog.addLeftLabel("", "Artboard Type")
    const types = ["Regular page", "Modal Dialog", "External URL Page", "Overlay"]
    const typeControl = dialog.addSelect("artboardType", "", artboardType, types, 250)
    typeControl.setCOSJSTargetFunction(enableTypeRelated)

    const enableShadowControl = dialog.addCheckbox("enableShadow", "Show modal dialog or overlay shadow", enableShadow)
    dialog.addHint("enableShadowHint", "Dim a previous artboard to set visual focus on an modal.")

    /////////////////////////// PAGE 2

    dialog.setTabForViewsCreating(1)

    dialog.addLeftLabel("overlayByEventLabel", "Show Overlay On")
    const overlayByEventControl = dialog.addSelect("overlayByEvent", "", overlayByEvent, ["Click", "Mouse Over"], 250)
    ///
    const overlayPins = [
        { name: "Hotspot", id: "overlay_pin_hotspot_position", selectedIndex: overlayPinHotspot },
        { name: "Page", id: "overlay_pin_page_position", selectedIndex: overlayPinPage }
    ]
    dialog.addLeftLabel("overlayPinLabel", "Pin Overlay To")
    const overlayPinControl = dialog.addSelect("overlayPin", "", overlayPin, overlayPins.map(value => value.name), 250)
    overlayPinControl.setCOSJSTargetFunction(handleOverlayPin)

    ////
    dialog.overlayPositions = [
        ["Under hotspot from left corner to right", "Under hostpot on center", "Under hotspot from right corner to left",
            "From hotspot top left corner", "From hotspot top center", "From hotspot top right corner",
            "To the right of the bottom right corner of hotspot"],
        ["Page top left", "Page top center", "Page top right",
            "Page bottom left", "Page bottom center", "Page bottom right",
            "Page center"]
    ]
    dialog.addSpace()
    dialog.addLeftLabel("overlayAlignLabel", "Overlay Position")
    var overlayAlignControlRadios = []
    const imageWidth = 342
    const imageHeight = 170
    const radioWidth = 20
    const radioHeight = 18
    const xDelta = 100
    const yDelta = 65
    const hSpace = 10
    var orgFrame = dialog.getNewFrame(radioHeight, radioWidth)

    dialog.overlayPositions.forEach(function (positions, pinIndex) {
        var frame = Utils.copyRect(orgFrame)
        const pin = overlayPins[pinIndex]
        //
        const imageName = "artboard_layerposition_" + pinIndex + "@2x.png"
        var image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed(imageName).path())
        const imageFrame = Utils.copyRect(orgFrame)
        imageFrame.origin.y -= imageHeight - radioHeight
        imageFrame.size.width = imageWidth
        imageFrame.size.height = imageHeight
        const imageView = dialog.addImage("overlayAlignImage-" + pinIndex, image, imageFrame)
        imageView.hidden = true
        //        
        dialog.startRadioButtions(pin.id, pin.selectedIndex)
        //
        positions.forEach(function (label, index) {
            const radioControl = dialog.addRadioButton("overlayAlignRadio-" + pinIndex + "-" + index, " ", index, frame)
            radioControl.toolTip = label
            overlayAlignControlRadios.push(radioControl)
            frame.origin.x += radioWidth
            radioControl.hidden = true
            //
            if ((index + 1) % 3 === 0) {
                frame.origin.x = dialog.leftColWidth
                frame.origin.y -= yDelta
            } else {
                frame.origin.x += xDelta
            }

        }, context)
    }, context)

    dialog.y -= imageHeight
    ///
    dialog.addDivider()
    dialog.addLeftLabel("overlayFixedLabel", "Fixed Panels")
    const overlayOverFixedControl = dialog.addCheckbox("overlayOverFixed", "Show overlay over fixed panels", overlayOverFixed)
    const overlayAlsoFixedControl = dialog.addCheckbox("overlayAlsoFixed", "Show overlay as fixed panel if called from fixed panel", overlayAlsoFixed)
    const overlayClosePrevOverlayControl = dialog.addCheckbox("overlayClosePrevOverlay", "Replace the previous overlay if called from overlay", overlayClosePrevOverlay)

    // PAGE "TRANSITION"
    dialog.setTabForViewsCreating(2)
    dialog.addSpace()

    dialog.addLeftLabel("", "Transition Effect")
    {
        const aniTypePositions = [
            { x: 0, y: 0, label: 'None' },
            { x: 1, y: 0, label: "Slide-in Up" },
            { x: 0, y: 1, label: "Slide-in Left" },
            { x: 1, y: 1, label: "Fade-in" },
            { x: 2, y: 1, label: "Slide-in Right" },
            { x: 1, y: 2, label: "Slide-in Down" },
        ]
        var transAnimTypelRadios = []
        //
        var orgFrame = dialog.getNewFrame(radioHeight, radioWidth)
        //
        const imageName = "artboard_transition_animation@2x.png"
        var image = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed(imageName).path())
        const imageFrame = Utils.copyRect(orgFrame)
        imageFrame.origin.y -= imageHeight - radioHeight
        imageFrame.size.width = imageWidth
        imageFrame.size.height = imageHeight
        const imageView = dialog.addImage("animationImage", image, imageFrame)
        //imageView.hidden = true
        //        
        dialog.startRadioButtions("transAnimType", transAnimType)
        //
        aniTypePositions.forEach(function (info, index) {
            var frame = Utils.copyRect(orgFrame)
            frame.origin.x = dialog.leftColWidth + (xDelta + radioWidth) * info.x
            frame.origin.y = orgFrame.origin.y - yDelta * info.y

            const radioControl = dialog.addRadioButton("transAnimType-" + index, " ", index, frame)
            radioControl.toolTip = info.label
            transAnimTypelRadios.push(radioControl)
        }, context)
        dialog.y -= imageHeight
    }

    dialog.addDivider()
    dialog.addLeftLabel("", "Auto-transition")

    const transNextSecsControl = dialog.addTextInput("transNextSecs", "Delay (Secs)", transNextSecs, '', 60)
    dialog.addHint("transNextSecsHint", "Go to the next page auto the delay (0.001 - 60 secs)")

    dialog.addDivider()
    const enableAutoScrollControl = dialog.addCheckbox("enableAutoScroll", "Scroll browser page to top", enableAutoScroll)
    dialog.addHint("enableAutoScrollHint", "The artboard will be scrolled on top after showing")



    enableTypeRelated()

    ///////////////// RUN EVENT LOOP ///////////////////////
    while (true) {
        // Cancel clicked
        if (!dialog.run()) break;

        // OK clicked
        // read data
        transNextSecs = transNextSecsControl.stringValue() + ""
        artboardType = typeControl.indexOfSelectedItem()

        // check data        
        if (transNextSecs != '' && isNaN(parseFloat(transNextSecs))) {
            continue
        }

        // save data

        Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_TYPE, artboardType)
        if (overlayByEventControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_BY_EVENT, overlayByEventControl.indexOfSelectedItem())
        if (overlayPinControl.isEnabled) {
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN, overlayPinControl.indexOfSelectedItem())
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN_HOTSPOT, dialog.views['overlay_pin_hotspot_position'].selectedIndex)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_PIN_PAGE, dialog.views['overlay_pin_page_position'].selectedIndex)
        }
        if (enableShadowControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_SHADOW, enableShadowControl.state() == 1)
        if (overlayOverFixedControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_OVERFIXED, overlayOverFixedControl.state() == 1)
        if (overlayAlsoFixedControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_ALSOFIXED, overlayAlsoFixedControl.state() == 1)
        if (overlayOverFixedControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_OVERLAY_CLOSE_PREVOVERLAY, overlayClosePrevOverlayControl.state() == 1)
        if (overlayAlsoFixedControl.isEnabled)
            if (enableAutoScrollControl.isEnabled)
                Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL, enableAutoScrollControl.state() != 1)
        if (transNextSecsControl.isEnabled)
            Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS, transNextSecs)
        Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_ANIM_TYPE, dialog.views['transAnimType'].selectedIndex)

        break

    }
    dialog.finish()

};

