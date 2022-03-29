
class AbstractViewer {
    constructor(divID) {
        this.divID = divID
        // common viewer settings, can be changed in child constructors
        this.isSidebarChild = true
        this.blockMainNavigation = false
        this.enableTopNavigation = false
        this.alwaysHandlePageChanged = false
        this.preventCustomTextSearch = true

        // internal viewer props, can be read by child 
        this.inited = false
        this.visible = false
        this.mouseover = false

        //
        viewer.allChilds.push(this)
    }


    initialize(force = false) {
        if (!force && this.inited) return false
        //
        if (this.preventCustomTextSearch) {
            const div = $('#' + this.divID)
            div.mouseenter(function () {
                this.mouseover = true
            })
            div.mouseleave(function () {
                this.mouseover = false
            })
        }
        //
        this.inited = true
        return true
    }

    // called by Viewer
    customTextSearchPrevented() {
        return this.preventCustomTextSearch && this.mouseover
    }

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
        this.mouseover = false
    }



}
