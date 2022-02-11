const EXP_IMODE_PAGE = "page"
const EXP_IMODE_PROJECT = "project"

class ExpViewer extends AbstractViewer {

    constructor() {
        super()
        this.mode = EXP_IMODE_PROJECT
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // setup mode switcher
        const modeSelect = $('#exp_viewer #mode_selector')
        modeSelect.change(function () {
            viewer.expViewer.setMode($(this).children("option:selected").val())

        })

        // init document common data here        
        this.inited = true

        // load data
        this._buildContent()
    }

    goPage(index) {
        this.hide()
        viewer.goToPage(index)
        viewer.symbolViewer.showFromExpViewer()
    }

    //////////
    _buildContent() {
        let html = `<div id="pages">`

        if (this.mode === EXP_IMODE_PAGE) {
            html += this._getContentForPage(layersData[viewer.currentPage.index])
        } else {
            // scan all pages
            layersData.filter(page => "c" in page).forEach(page => {
                html += this._getContentForPage(page)
            }, this);
        }

        html += `</div>`
        //
        let contentDiv = $("#exp_viewer_content")
        contentDiv.html(html)
    }

    _getContentForPage(page) {
        let html = ""
        // try to find experimenal components
        let foundExpLayers = {}
        this._findExpLayers(page.c, foundExpLayers)
        const symbols = Object.keys(foundExpLayers)
        if (!symbols.length) return html

        // show page with experimental components
        html += `
     <div ID="${page.index}" class="page">
         <a href="#" onclick="viewer.expViewer.goPage(${page.index})" class="link">${page.n}</a>
     `
        //
        function cleanLabel(label) {
            return label.replace("-EXPERIMENTAL", "-EXP")
        }
        symbols.forEach(symbolName => {
            html += `
     <div class="layer">
         ${cleanLabel(symbolName)}
     `
            const total = foundExpLayers[symbolName]
            if (total > 1) {
                html += `
             <span class="counter">(${total})</span>
         `
            }
            html += `
     </div>
     `
        }, this)
        //
        html += `
     </div>
     `
        return html
    }

    _findExpLayers(layers, foundExpLayers) {
        layers.forEach(l => {
            if (l.tp === "SI" && l.s && l.s.includes("EXPERIMENTAL")) {
                if (!(l.s in foundExpLayers)) foundExpLayers[l.s] = 0
                foundExpLayers[l.s]++
            }
            if (l.c && l.c.length) this._findExpLayers(l.c, foundExpLayers)
        }, this)
    }

    ////////////////////////////
    setMode(mode) {
        this.mode = mode
        this._buildContent()
    }

    ///////////////////////////////////////////////// called by Viewer
    _hideSelf() {
        $('#exp_viewer').addClass("hidden")
        super._hideSelf()
    }


    _showSelf() {
        if (!this.inited) this.initialize()
        $('#exp_viewer').removeClass("hidden")

        super._showSelf()
    }

    // called by Viewer
    pageChanged() {
        if (this.mode === EXP_IMODE_PAGE) {
            this._buildContent()
        }
    }
}
