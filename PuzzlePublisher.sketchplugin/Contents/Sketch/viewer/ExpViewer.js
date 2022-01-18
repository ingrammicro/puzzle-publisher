const EXP_IMODE_PAGE = "page"
const EXP_IMODE_PROJECT = "project"

class ExpViewer extends AbstractViewer {

    constructor() {
        super()
        this.mode = EXP_IMODE_PAGE
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // init document common data here        
        this.inited = true

        // load data
        this._buildContent()
    }

    goPage(index) {
        this.hide()
        viewer.goToPage(index)
        viewer.symbolViewer.show()
    }

    //////////
    _buildContent() {
        let html = `<div id="pages">`
        // scan pages
        layersData.filter(page => "c" in page).forEach(page => {
            // try to find experimenal components
            let foundExpLayers = {}
            this._findExpLayers(page.c, foundExpLayers)
            const symbols = Object.keys(foundExpLayers)
            if (!symbols.length) return

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
        }, this);

        html += `</div>`
        //
        let contentDiv = $("#exp_viewer_content")
        contentDiv.html(html)
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
}
