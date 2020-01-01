
class AbstractViewer {
    constructor() {
        this.visible = false
        this.isSidebarChild = true
        this.inited = false
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
