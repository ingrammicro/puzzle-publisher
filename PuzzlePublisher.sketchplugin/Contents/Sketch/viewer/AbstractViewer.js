
class AbstractViewer {
    constructor() {
        // common viewer settings, can be changed in child constructors
        this.isSidebarChild = true
        this.blockMainNavigation = false
        this.enableTopNavigation = false
        this.alwaysHandlePageChanged = false

        // internal viewer props, can be read by child 
        this.inited = false
        this.visible = false

        //
        viewer.allChilds.push(this)
    }


    // called by Viewer
    pageChanged() {

    }

    // called by viewer
    viewerResized() {

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
    onContentClick() {
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
