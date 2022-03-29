const EXP_SCOPE_PAGE = "page"
const EXP_SCOPE_PROJECT = "project"

const EXP_MODE_PAGES = "pages"
const EXP_MODE_WIDGETS = "widgets"

const EXP_FILTER_EXP = "exp"
const EXP_FILTER_ALL = "all"

class ExpViewer extends AbstractViewer {

    constructor() {
        super("exp_viewer")
        this.preventCustomTextSearch = true
        //
        this.scope = EXP_SCOPE_PROJECT
        this.mode = EXP_MODE_WIDGETS
        this.filter = EXP_FILTER_EXP
        //
        this.highlightWidgetName = null
    }

    initialize(force = false) {
        if (!super.initialize(force)) return
        // load data
        this._buildContent()
    }

    goPage(index) {
        this.hide()
        viewer.goToPage(index)
        viewer.symbolViewer.showFromExpViewer(this.highlightWidgetName)
    }

    //////////
    _buildContent() {
        if (this.mode === EXP_MODE_PAGES)
            this._buildContentPages()
        else
            this._buildContentWidgets()
    }

    //////////
    _buildContentPages() {
        let html = `<div class="pages">`

        if (this.scope === EXP_SCOPE_PAGE) {
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

    _findExpLayers(layers, foundExpLayers, layersExt = null, topPage = null) {
        layers.forEach(l => {
            let page = topPage
            if (layersExt != null && !topPage) page = l
            if (l.tp === "SI" && l.s && (this.filter == EXP_FILTER_ALL || l.s.includes("EXPERIMENTAL"))) {
                let name = this.filter == EXP_FILTER_ALL ? l.s.replace("-EXPERIMENTAL", "-EXP") : (l.s.split("-EXPERIMENTAL")[0] + "-EXP")
                if (!(name in foundExpLayers)) foundExpLayers[name] = 0
                foundExpLayers[name]++
                if (layersExt != null) {
                    if (!(name in layersExt)) layersExt[name] = {
                        pages: {}
                    }
                    layersExt[name].pages[page.index] = page
                }
            }
            if (l.c && l.c.length) this._findExpLayers(l.c, foundExpLayers, layersExt, page)
        }, this)
    }
    ////////////////////////////////////////////////
    _buildContentWidgets() {
        const [widgets, widgetSet, widgetsExt] = this._getWidgetsSorted()

        let html = `<div class="widgets">`
        // Scan top-level layers(pages) with childs
        widgets.forEach(widget => {
            html += this._getContentForWidget(widgetSet, widgetsExt, widget)
        }, this);

        html += `</div>`
        //
        let contentDiv = $("#exp_viewer_content")
        contentDiv.html(html)
    }

    _getWidgetsSorted() {
        const pages = this.scope === EXP_SCOPE_PROJECT ? layersData.filter(page => "c" in page) : [layersData[viewer.currentPage.index]]
        let widgetSet = {}, widgetsExt = {}
        this._findExpLayers(pages, widgetSet, widgetsExt)
        const widgets = Object.keys(widgetSet).sort()
        return [widgets, widgetSet, widgetsExt]
    }

    _getContentForWidget(widgetSet, widgetsExt, widgetName) {
        let html = ""
        let widgetNameCleaned = widgetName
        let widgetInfo = widgetsExt[widgetName]
        let pageCount = Object.keys(widgetInfo.pages).length
        const highlightWidgetClass = this.highlightWidgetName && widgetNameCleaned.includes(this.highlightWidgetName) ? "highlight" : ""

        // show page with experimental components
        html += `
     <div ID="exp-widget-${widgetName}" class="widget ${highlightWidgetClass}">
         <a href="#" onclick="viewer.expViewer.goWidget('${widgetName}')" class="link">${widgetNameCleaned}</a> <span class="counter">(${pageCount})</span>
     `
        //     
        Object.keys(widgetInfo.pages).forEach(pageIndex => {
            const page = layersData[pageIndex]
            html += `        
     <div onclick="viewer.expViewer.goPage(${pageIndex})" class="page hidden">
         ${page.n}
     </div>
     `
        }, this)
        //
        html += `
     </div >
                `
        return html
    }


    goWidget(widgetName) {
        const pagesDiv = $(document.getElementById("exp-widget-" + widgetName))
        const widgetsDiv = pagesDiv.find(".page")
        this._toogleClass(widgetsDiv, "hidden")
    }

    _toogleClass(obj, className) {
        if (!obj.hasClass(className)) obj.addClass(className); else obj.removeClass(className)
    }

    ////////////////////////////
    setScope(scope) {
        this.scope = scope
        this._buildContent()
    }
    setMode(mode) {
        this.mode = mode
        this._buildContent()
    }
    setFilter(filter) {
        this.filter = filter
        this._buildContent()
    }

    ///////////////////////////////////////////////// called by Viewer
    _hideSelf() {
        $('#exp_viewer').addClass("hidden")
        //this.highlightWidgetName = null

        super._hideSelf()
    }


    _showSelf() {
        if (!this.inited) this.initialize()
        $('#exp_viewer').removeClass("hidden")

        super._showSelf()
    }

    // called by Viewer
    pageChanged() {
        if (this.scope === EXP_SCOPE_PAGE) {
            this._buildContent()
        }
    }

    highlightWidget(widgetName) {
        this.highlightWidgetName = widgetName.replace("-EXPERIMENTAL", "-EXP")
        if (!this.highlightWidgetName.includes("-EXP")) {
            $("#exp-filter-exp").prop("checked", false)
            $("#exp-filter-all").prop("checked", true)
            this.setFilter(EXP_FILTER_ALL)
        }
    }
}
