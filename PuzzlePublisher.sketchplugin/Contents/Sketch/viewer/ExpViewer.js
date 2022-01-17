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

    //////////
    _buildContent() {
        let html = `<div id="pages">`
        // scan pages
        layersData.forEach(page => {
            // try to find experimenal components
            let foundExpLayers = []
            this._findExpLayers(page.c, foundExpLayers)
            if (!foundExpLayers.length) return

            // show page with experimental components
            html += `
                <div ID="${page.index}" class="page">
                    ${page.n}
                `
            //
            foundExpLayers.forEach(l => {
                html += `
                <div class="layer">
                    &nbsp;&nbsp;${l.s}
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
                foundExpLayers.push(l)
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
