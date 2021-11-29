
let presenterViewer = null;
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
        this.transPeriod = 3000 // msec                
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
        } else {
            //return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    ///////////////////////// OWN METHODS
    play() {
        // enable full screen
        const elem = document.documentElement
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
        //
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

    stop() {
        // Disable full screen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        //        
        this.hide()
    }

}
