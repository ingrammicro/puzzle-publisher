
class AbstractViewer {
    constructor() {
        // common viewer settings, can be changed in child constructors
        this.isSidebarChild = true
        this.blockMainNavigation = false

        // internal viewer props, can be read by child 
        this.inited = false
        this.visible = false
    }


    hide() {
        viewer.hideChild()
    }

    show() {
        viewer.showChild(this)
    }

    toggle() {
        return this.visible ? this.hide() : this.show()
    }

    handleKeyDown(jevent) {
        return false
    }

    handleKeyDownWhileInactive(jevent) {
        return false
    }


    isVisible() {
        return this.visible
    }

    toggle() {
        return this.visible ? this.hide() : this.show()
    }

    _showSelf() {
        this.visible = true
    }

    _hideSelf() {
        this.visible = false
    }



}
