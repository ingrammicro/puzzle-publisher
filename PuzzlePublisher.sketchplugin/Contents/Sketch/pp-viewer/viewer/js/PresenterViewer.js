let presenterViewer = null;
const STORAGE_TRANSPERIOD = "presenterViewer.transPeriod"

function doPresenterViewerNext() {
    const nextPage = viewer.getNextUserPage()
    // check if we need to stop
    if ((!nextPage || nextPage.userIndex === 0 && false)) {
        presenterViewer.stop()
        return
    }
    presenterViewer.gotoPageWithDelay(nextPage.index)
}

class PresenterViewer extends AbstractViewer {
    constructor() {
        super()

        this.isSidebarChild = false
        this.blockMainNavigation = true

        presenterViewer = this
    }

    initialize(force = false) {
        if (!force && this.inited) return
        //
        {
            const savedPeriod = window.localStorage.getItem(STORAGE_TRANSPERIOD)
            this.transPeriod = savedPeriod != null ? savedPeriod : 3000 // msec                
        }
        //
        this.inited = true
    }

    ///////////////////////////////////////////////// called by Viewer


    _hideSelf() {
        super._hideSelf()
        // Hide all UI controls
        viewer.toogleUI(true)
    }
    _showSelf() {
        if (!this.inited) this.initialize()
        //
        super._showSelf()
        // Start a presentation from first page    
        const startIndex = viewer.getFirstUserPage()
        if (startIndex === null) {
            this._hideSelf()
            return
        }
        //
        viewer.toogleUI(false)
        this.gotoPageWithDelay(startIndex)
    }


    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (80 == event.which && !this.visible) { // p
            // Key "P" activates self
            this.play()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }


    handleKeyDown(jevent) {
        const event = jevent.originalEvent

        if (27 == event.which || 80 == event.which) { // esc or p
            this.stop()
        } else if (event.which >= 49 && event.which < 57) { // 1..9
            this.transPeriod = 1000 * (event.which - 48)
            window.localStorage.setItem(STORAGE_TRANSPERIOD, this.transPeriod)
        } else {
            //return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    ///////////////////////// OWN METHODS
    play() {
        viewer._enableFullScreen()
        this.show()
    }

    gotoPageWithDelay(pageIndex) {
        // Probalbly we have stopped already
        if (!this.visible) return
        // Show page
        viewer.goTo(pageIndex, false)
        // Go to the next page with delay
        setTimeout(doPresenterViewerNext, this.transPeriod)
    }

    stop(exitFullScreen = true) {
        if (!this.visible) return
        // Disable full screen
        if (exitFullScreen) {
            viewer._disableFullScreen()
        }
        //        
        this.hide()
    }

}
