var UIDialog_iconImage = null

 function Class(className, BaseClass, selectorHandlerDict) {
    var uniqueClassName = className + NSUUID.UUID().UUIDString();
    var delegateClassDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, BaseClass);
    for (var selectorString in selectorHandlerDict) {
        delegateClassDesc.addInstanceMethodWithSelector_function_(selectorString, selectorHandlerDict[selectorString]);
    }
    delegateClassDesc.registerClass();
    return NSClassFromString(uniqueClassName);
};

class UIAbstractWindow {

    constructor(window, intRect) {
        this.window = window

        var container = NSView.alloc().initWithFrame(intRect)
        this.container = container
        this.views = []

        this.y = NSHeight(intRect)
        this.rect = intRect
    }

    enableTextByID(id, enabled) {
        if (!(id in dialog.views)) return

        var text = dialog.views[id]
        if (!enabled)
            text.textColor = NSColor.disabledControlTextColor()
        else
            text.textColor = NSColor.controlTextColor()

    }

    enableHintByID(id, enabled) {
        if (!(id in dialog.views)) return

        var text = dialog.views[id]
        if (!enabled)
            text.textColor = NSColor.disabledControlTextColor()
        else
            text.textColor = NSColor.secondaryLabelColor()

    }

    enableControlByID(id, enabled) {
        var control = dialog.views[id]
        control.enabled = enabled
        
        this.enableTextByID(id + 'Label', enabled)
        this.enableHintByID(id + 'Hint', enabled)

    }

    getNewFrame(height = 25, width = -1, yinc = -1) {
        var frame = NSMakeRect(0, this.y - height, width == -1 ? NSWidth(this.rect) - 10 : width, height)
        this.y -= height + (yinc >= 0 ? yinc : 10)
        return frame
    }

    addSpace() {
        this.getNewFrame(0)
    }

    addLabel(id, text, height = 25) {
        const label = NSTextField.alloc().initWithFrame(this.getNewFrame(height));
        label.setStringValue(text);
        label.setBezeled(false);
        label.setDrawsBackground(false);
        label.setEditable(false);
        label.setSelectable(false);       

        if ('' != id) this.views[id] = label

        this.container.addSubview(label)
        this.y += 5
        return label
    }

    addCheckbox(id, label, checked, height = 18) {
        checked = (checked == false) ? NSOffState : NSOnState;

        const checkbox = NSButton.alloc().initWithFrame(this.getNewFrame(height, -1, 6));
        checkbox.setButtonType(NSSwitchButton);
        checkbox.setBezelStyle(0);
        checkbox.setTitle(label);
        checkbox.setState(checked);

        this.container.addSubview(checkbox)
        this.views[id] = checkbox
        return checkbox
    }

    addTextBox(id, label, textValue, inlineHint = "", height = 120) {
        if (label != '') this.addLabel(id + "Label", label, 17)

        const textBox = NSTextField.alloc().initWithFrame(this.getNewFrame(height))
        textBox.setEditable(true)
        textBox.setBordered(true)
        textBox.setStringValue(textValue)
        if (inlineHint != "") {
            textBox.setPlaceholderString(inlineHint)
        }

        this.container.addSubview(textBox)
        this.views[id] = textBox

        return textBox
    }

    addTextInput(id, label, textValue, inlineHint = "", width = 220, frame = undefined) {
        if (label != '') this.addLabel(id + "Label", label, 17)

        const input = NSTextField.alloc().initWithFrame(frame ? frame : this.getNewFrame(20, width))
        input.setEditable(true)
        input.setBordered(true)
        input.setStringValue(textValue)
        if (inlineHint != "") {
            input.setPlaceholderString(inlineHint)
        }

        this.container.addSubview(input)
        this.views[id] = input

        return input
    }

    // opt: required: id, label, labelSelect, textValue
    //      optional: inlineHint = "", width = 220, widthSelect = 50), askFilePath=false
    addPathInput(opt) {
        if(!('width' in opt)) opt.width = 220
        if(!('widthSelect' in opt)) opt.widthSelect = 50
        if(!('inlineHint' in opt)) opt.inlineHint = ""
        if(!('askFilePath' in opt)) opt.askFilePath = false
        
        if (opt.label != '') this.addLabel(opt.id + "Label", opt.label, 17)

        const frame = this.getNewFrame(20, opt.width - opt.widthSelect - 5)
        const frame2 = Utils.copyRect(frame)
        frame2.origin.x = frame2.origin.x + opt.width - opt.widthSelect
        frame2.origin.y -= 8

        const input = this.addTextInput(opt.id, "", opt.textValue, opt.inlineHint, 0, frame)

        this.addButton(opt.id + "Select", opt.labelSelect, function () {
            const newPath = opt.askFilePath
                ? Utils.askFilePath(input.stringValue() + "")
                : Utils.askPath(input.stringValue() + "")
            if (newPath != null) {
                input.setStringValue(newPath)
            }
            return
        }, 0, frame2)
        return input
    }

    addComboBox(id, label, selectItem, options, width = 100) {
        if (label != '') this.addLabel(id + "Label", label, 15)

        const v = NSPopUpButton.alloc().initWithFrame(this.getNewFrame(23, width));
        v.addItemsWithTitles(options)
        v.selectItemAtIndex(selectItem)

        this.container.addSubview(v)
        this.views[id] = v
        return v
    }


    addRadioButtons(id, label, selectItem, options, width = 100) {
        if (label != '') this.addLabel(id + "Label", label, 15)

        // pre-select the first item
        if (selectItem < 0) selectItem = 0

        let radioTargetFunction = (sender) => {
            sender.myGroup.selectedIndex = sender.myIndex
        };

        let group = {
            btns: [],
            selectedIndex: selectItem
        }
        for (var item of options) {
            const index = group.btns.length

            const btn = NSButton.alloc().initWithFrame(this.getNewFrame(18, width))
            btn.setButtonType(NSRadioButton)
            btn.setTitle(item)
            btn.setState(index != selectItem ? NSOffState : NSOnState)
            btn.myGroup = group
            btn.myIndex = index
            btn.setCOSJSTargetFunction(sender => radioTargetFunction(sender));

            this.container.addSubview(btn)
            group.btns.push(btn)
        }

        this.views[id] = group
        return group
    }

    addButton(id, label, func, width = 100, frame = undefined) {
        // create OK button
        var btn = NSButton.alloc().initWithFrame(frame ? frame : this.getNewFrame(20, width));
        btn.setTitle(label)
        btn.setBezelStyle(NSRoundedBezelStyle)
        btn.sizeToFit()
        btn.setCOSJSTargetFunction(func)

        this.container.addSubview(btn)
        this.views[id] = btn
        return btn

    }

    addHint(id, label, height = 23) {
        this.y += 3

        const hint = NSTextField.alloc().initWithFrame(this.getNewFrame(height, -1, 3));
        hint.setStringValue(label);
        hint.setColor = NSColor.secondaryLabelColor()
        hint.setBezeled(false);
        hint.setDrawsBackground(false);
        hint.setEditable(false);
        hint.setSelectable(false);
        hint.setFont(NSFont.systemFontOfSize(10))

        this.container.addSubview(hint)
        if ('' != id) this.views[id] = hint
        return hint
    }


    finish() {
        this.window = null
    }

}

class UIDialog extends UIAbstractWindow {

    static setUp(context) {
        UIDialog_iconImage = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path())
    }

    constructor(title, rect, okButtonTitle, description = '') {
        var window = NSAlert.alloc().init()
        window.setIcon(UIDialog_iconImage)
        window.setMessageText(title)
        if (description != '') {
            window.setInformativeText(description)
        }
        if (undefined != okButtonTitle) {
            window.addButtonWithTitle(okButtonTitle)
        }
        window.addButtonWithTitle("Cancel")

        super(window, rect)

        window.setAccessoryView(this.container)
        this.userClickedOK = false
    }


    run() {
        return this.window.runModal() == '1000'
    }

}
