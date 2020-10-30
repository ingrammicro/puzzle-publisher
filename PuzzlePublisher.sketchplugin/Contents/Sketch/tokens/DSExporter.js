@import("constants.js")
@import("lib/utils.js")
@import("lib/uidialog.js")
@import("lib/ga.js")

const bordedLineJoinMap2 = {
    [Style.LineJoin.Miter]: "miter",
    [Style.LineJoin.Round]: "round",
    [Style.LineJoin.Bevel]: "bevel"
}

const bordedArrowheadMap2 = {
    [Style.Arrowhead.None]: "none",
    [Style.Arrowhead.OpenArrow]: "openarrow",
    [Style.Arrowhead.FilledArrow]: "filledarrow",
    [Style.Arrowhead.OpenCircle]: "opencircle",
    [Style.Arrowhead.FilledCircle]: "filledcircle",
    [Style.Arrowhead.OpenSquare]: "opensquare",
    [Style.Arrowhead.FilledSquare]: "filledsquare",
}


const bordedLineEndMap2 = {
    [Style.LineEnd.Butt]: "butt",
    [Style.LineEnd.Round]: "round",
    [Style.LineEnd.Projecting]: "projecting"
}

const BLENDING_MODE_SKETCH_TO_CSS = {
    [Style.BlendingMode.Normal]: "normal",
    [Style.BlendingMode.Darken]: "darken",
    [Style.BlendingMode.Multiply]: "multiply",
    [Style.BlendingMode.ColorBurn]: "color-burn",
    [Style.BlendingMode.Lighten]: "lighten",
    [Style.BlendingMode.Screen]: "screen",
    [Style.BlendingMode.ColorDodge]: "color-dodge",
    [Style.BlendingMode.Overlay]: "overlay",
    //"darken", [Style.BlendingMode.SoftLight]:  // Not supported in CSS
    //"darken", [Style.BlendingMode.HardLight]:  // Not supported in CSS
    [Style.BlendingMode.Difference]: "difference",
    [Style.BlendingMode.Exclusion]: "exclusion",
    [Style.BlendingMode.Hue]: "hue",
    [Style.BlendingMode.Saturation]: "saturation",
    [Style.BlendingMode.Color]: "color",
    [Style.BlendingMode.Luminosity]: "luminosity"
}


const eol = ";\n"
const pxeol = "px" + eol
var app = undefined

const formatDefs = {
    [Constants.EXPORT_FORMAT_LESS]: {
        ext: ".less",
        symb: "@"
    },
    [Constants.EXPORT_FORMAT_SCSS]: {
        ext: ".scss",
        symb: "$"
    }
}

class DSExporter {
    constructor(context) {
        this.nDoc = context.document
        this.sDoc = Sketch.fromNative(context.document)
        this.context = context
        this.UI = require('sketch/ui')

        this.messages = ""
        this.errors = []

        this.layerStyles = {}
        this.textStyles = {}
        this.runningForTokens = true

        this.docName = this._clearCloudName(this.nDoc.cloudName())
        this.pathTo = undefined
        this.format = undefined
        this.confOpts = undefined
        this.opts = {
            colors: {
                tokens: {}, index: 0, name: "color-", comment: "COLOR TOKENS", postix: "",
            },
            fontSizes: {
                tokens: {}, index: 0, name: "font-size-", comment: "FONT SIZE TOKENS", postix: "px",
            },
            fontWeights: {
                tokens: {}, index: 0, name: "font-weight-", comment: "FONT WEIGHTS TOKENS", postix: "",
            },
            fontFamilies: {
                tokens: {}, index: 0, name: "font-family-", comment: "FONTS", postix: "",
            },
        }

    }

    init() {
        this.pathTo = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_PATH_TO)
        if (undefined == this.pathTo) this.pathTo = ""
        this.format = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_FORMAT)
        if (undefined == this.format) this.format = Constants.EXPORT_FORMAT_LESS

        this.confExportLibStyles = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_LIB_STYLES) == 1

        this.confOpts = Settings.settingForKey(SettingKeys.PLUGIN_EXPORT_OPTS)
        if (undefined == this.confOpts) this.confOpts = {}
        if (null == this.confOpts.colorTokens) this.confOpts.colorTokens = true
        if (null == this.confOpts.fontSizeTokens) this.confOpts.fontSizeTokens = true
        if (null == this.confOpts.fontWeightTokens) this.confOpts.fontWeightTokens = true
        if (null == this.confOpts.fontFamilyTokens) this.confOpts.fontFamilyTokens = true

        // init global variable
        app = this
    }

    initForPublisher() {
        this.format = Constants.EXPORT_FORMAT_LESS
        this.confOpts = {}
        this.runningForTokens = false

        // init global variable
        app = this
    }

    // Tools
    logMsg(msg) {
        if (this.runningForTokens) {
            this.messages += msg + "\n"
        } else {
            log(msg)
        }
    }


    logError(error) {
        this.logMsg("[ ERROR ] " + error)
        this.errors.push(error)
    }

    stopWithError(error) {
        this.UI.alert('Error', error)
        exit = true
    }

    // Public methods

    run() {
        const res = this._showDialog()
        if ('cancel' == res) return false

        var success = this._export()

        // show final message
        if (this.errors.length > 0) {
            this._showErrors()
        } else {
            if (success) {
                track(TRACK_EXPORT_COMPLETED)
                this.UI.message("Completed")
            }
        }

        return true
    }

    // Internal

    _clearCloudName(cloudName) {
        let name = cloudName
        let posSketch = name.indexOf(".sketch")
        if (posSketch > 0) {
            name = name.slice(0, posSketch)
        }
        return name
    }



    _showMessages() {
        const dialog = new UIDialog("Completed", NSMakeRect(0, 0, 400, 400), "Dismiss", "", "")
        dialog.addTextViewBox("messages", "See what has been changed:", this.messages, 400)
        const result = dialog.run()
        dialog.finish()
    }

    _showErrors() {
        var errorsText = this.errors.join("\n\n")

        const dialog = new UIDialog("Found errors", NSMakeRect(0, 0, 600, 600), "Who cares!", "", "")
        dialog.addTextViewBox("debug", "", errorsText, 600)
        const result = dialog.run()
        dialog.finish()
    }

    _showDialog() {
        const dialog = new UIDialog("Export Styles", NSMakeRect(0, 0, 800, 300), "Export",
            "Export all text styles to a text file")
        //dialog.removeLeftColumn()
        dialog.leftColWidth = 200

        dialog.addLeftLabel("", "Destination")
        dialog.addPathInput({
            id: "pathTo", label: "", labelSelect: "Select Folder",
            textValue: this.pathTo,
            inlineHint: 'e.g. ~/Temp', width: 520
        })

        dialog.addLeftLabel("", "File Format")
        dialog.addRadioButtons("format", "", this.format, ["LESS", "SCSS"], 250)

        dialog.addDivider()

        dialog.addLeftLabel("", "Create tokens for")
        dialog.addCheckbox("colorTokens", "Colors", this.confOpts.colorTokens)
        dialog.addCheckbox("fontSizeTokens", "Font Sizes", this.confOpts.fontSizeTokens)
        dialog.addCheckbox("fontWeightTokens", "Font Weights", this.confOpts.fontWeightTokens)
        dialog.addCheckbox("fontFamilyTokens", "Font Families", this.confOpts.fontFamilyTokens)

        if (null == this.confOpts.colorTokens) this.confOpts.colorTokens = true
        if (null == this.confOpts.fontSizeTokens) this.confOpts.fontSizeTokens = true
        if (null == this.confOpts.fontWeightTokens) this.confOpts.fontWeightTokens = true
        if (null == this.confOpts.fontFamilyTokens) this.confOpts.fontFamilyTokens = true

        dialog.addSpace()
        dialog.addLeftLabel("", "Styles")
        dialog.addCheckbox("exportLibStyles", "Export external library styles", this.confExportLibStyles)


        while (true) {
            dialog.run()
            if (dialog.userClickedCancel) {
                dialog.finish()
                return "cancel"
            }

            // Check data
            this.pathTo = dialog.views['pathTo'].stringValue() + ""
            if ("" == this.pathTo) continue
            this.format = dialog.views['format'].selectedIndex
            this.confExportLibStyles = dialog.views['exportLibStyles'].state() == 1
            this.less = this.format == Constants.EXPORT_FORMAT_LESS
            this.scss = this.format == Constants.EXPORT_FORMAT_SCSS
            this.confOpts.colorTokens = dialog.views['colorTokens'].state() == 1
            this.confOpts.fontSizeTokens = dialog.views['fontSizeTokens'].state() == 1
            this.confOpts.fontWeightTokens = dialog.views['fontWeightTokens'].state() == 1
            this.confOpts.fontFamilyTokens = dialog.views['fontFamilyTokens'].state() == 1
            this.def = formatDefs[this.format]
            // Save data

            Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_PATH_TO, this.pathTo)
            Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_FORMAT, this.format)
            Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_OPTS, this.confOpts)
            Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORT_LIB_STYLES, this.confExportLibStyles)
            break
        }

        return "ok"
    }

    ///////////////////////////////////////////////////////////////

    _export() {
        const textStylesText = this._getStylesAsText()
        const tokensText = this._getTokensAsText()

        let res = tokensText + textStylesText

        const fullPathTo = this.pathTo + "/" + this.docName + this.def.ext
        Utils.writeToFile(res, fullPathTo);

        return true

    }

    _getStylesAsText() {
        let res = ""
        res += "///////////////// Text Styles /////////////////\n"
        this.sDoc.sharedTextStyles.forEach(function (sStyle) {
            if (!this.confExportLibStyles && sStyle.getLibrary()) return
            if (DEBUG) log("export text style: " + sStyle.name)
            res += this._getStyleInfoAsText(sStyle)
            let si = this._parseStyleName(sStyle.name, true)
            res += si.openTags
            ///            
            res += this._getTextStylePropsAsText(sStyle.style, si.spaces)
            ///
            res += si.closeTags
        }, this)

        res += "///////////////// Layer Styles /////////////////\n"
        this.sDoc.sharedLayerStyles.forEach(function (sStyle) {
            if (!this.confExportLibStyles && sStyle.getLibrary()) return
            if (DEBUG) log("export layer style: " + sStyle.name)
            res += this._getStyleInfoAsText(sStyle)
            let si = this._parseStyleName(sStyle.name, false)
            //
            res += si.openTags
            res += this._getLayerStylePropsAsText(sStyle, null, sStyle.style, si.spaces)
            res += si.closeTags
            // save additional borders
            const borders = sStyle.style.borders.filter(s => s.enabled)
            for (let i = 1; i < borders.length; i++) {
                if (1 == i)
                    res += "/////// Additional borders for " + sStyle.name + "\n"
                res += si.openTags
                res += this._getLayerBorderByIndexAsText(sStyle.style, i, si.spaces)
                res += si.closeTags
            }
            // save additional fills
            const fills = sStyle.style.fills.filter(s => s.enabled)
            for (let i = 1; i < fills.length; i++) {
                if (1 == i)
                    res += "/////// Additional fills for " + sStyle.name + "\n"
                res += si.openTags
                res += this._getLayerFillByIndexAsText(sStyle.style, i, si.spaces)
                res += si.closeTags
            }

        }, this)

        return res
    }

    _getStyleInfoAsText(sStyle) {
        let res = ""
        res += "///////////////" + sStyle.name + "\n"

        let sLib = sStyle.getLibrary()
        if (sLib != null) {
            res += "///////////////" + "library: " + sLib.name + "\n"
        }
        return res
    }

    _getTokensAsText() {
        let res = ""

        Object.keys(this.opts).forEach((optName) => {
            res += this.getAbstractTokensAsText(this.opts[optName])
        }, this)

        return res
    }

    getAbstractTokensAsText(opt) {
        let res = ""
        if (opt.index) {
            const def = this.def
            res += "//////////// " + opt.comment + " TOKENS //////////\n"
            Object.keys(opt.tokens).forEach((value) => {
                const token = opt.tokens[value]
                res += def.symb + token.name + ":         " + value + opt.postix + ";\n"
            }, this)
            res += "\n"
        }
        return res
    }

    _getAbstractToken(opt, value) {
        let token = opt.tokens[value]
        if (null == token) {
            // create new token
            token = {
                value: value,
                name: opt.name + (opt.index < 10 ? "0" : "") + (opt.index < 100 ? "0" : "") + opt.index++
            }
            opt.tokens[value] = token
        }
        return this.def.symb + token.name
    }

    _getColorToken(color) {
        // drop FF transparency as default
        if (color.length == 9 && color.substring(7).toUpperCase() == "FF") {
            color = color.substring(0, 7)
        }
        if (!this.confOpts.colorTokens) return color.toUpperCase()
        return this._getAbstractToken(this.opts.colors, color)
    }
    _getFontSizeToken(fontSize) {
        if (!this.confOpts.fontSizeTokens) return fontSize + "px"
        return this._getAbstractToken(this.opts.fontSizes, fontSize)
    }
    _getFontFamilyToken(fontFamily) {
        if (!this.confOpts.fontFamilyTokens) return fontFamily
        return this._getAbstractToken(this.opts.fontFamilies, fontFamily)
    }
    _getFontWeightToken(fontWeight) {
        if (!this.confOpts.fontWeightTokens) return fontWeight
        return this._getAbstractToken(this.opts.fontWeights, fontWeight)
    }


    _getTextStylePropsAsText(sStyle, spaces = "") {
        // In some cases text object can has non-text style
        if (sStyle.styleType != "Text") return

        let res = ""

        res += spaces + "font-family" + ": " + this._getFontFamilyToken(sStyle.fontFamily) + eol
        res += spaces + "font-size" + ": " + this._getFontSizeToken(sStyle.fontSize) + eol
        res += spaces + "text-align" + ": " + alignMap2[sStyle.alignment] + eol
        res += spaces + "vertical-align" + ": " + vertAlignMap2[sStyle.verticalAlignment] + eol
        {
            var cssWeights = weights.filter(w => w.sketch == sStyle.fontWeight)
            if (cssWeights.length == 0)
                this.logError('Can not find CSS font-weifgt for Sketch fontWeught ' + sStyle.fontWeight)
            else
                res += spaces + "font-weight" + ": " + this._getFontWeightToken(cssWeights[0].css) + eol
        }
        if (undefined != sStyle.fontStyle) {
            res += spaces + "font-style" + ": " + sStyle.fontStyle + eol
        }
        if (null != sStyle.lineHeight)
            res += spaces + "line-height" + ": " + sStyle.lineHeight + pxeol
        if (undefined != sStyle.textTransform) {
            res += spaces + "text-transform" + ": " + sStyle.textTransform + eol
        }
        if (undefined != sStyle.textUnderline) {
            res += spaces + "text-decoration" + ": " + "underline" + eol
        }
        if (undefined != sStyle.textStrikethrough) {
            res += spaces + "text-decoration" + ": " + "line-through" + eol
        }
        if (null != sStyle.kerning) {
            res += spaces + "letter-spacing" + ": " + sStyle.kerning + pxeol
        }
        if (this.runningForTokens) {
            res += spaces + PT_PARAGRAPH_SPACING + ": " + sStyle.paragraphSpacing + eol
        }

        //
        res += spaces + "color" + ": " + this._getColorToken(sStyle.textColor) + eol

        return res
    }


    _getLayerStylePropsAsText(sSharedStyle, layer, sStyle, spaces = "") {
        let res = ""

        // process the first fill, other will be processed later
        res += this._getLayerFillByIndexAsText(sStyle, 0, spaces)

        // process the first border, other will be processed later
        res += this._getLayerBorderByIndexAsText(sStyle, 0, spaces)

        // process shadows
        res += this._getLayerShadowsText(sStyle, spaces)

        // try to find and save border radius(es)
        while (true) {
            const layers = sSharedStyle ? sSharedStyle.getAllInstancesLayers() : [layer]
            if (0 == layers.length) break
            const l = layers[0] // take the first
            if ("Shape" != l.type && "ShapePath" != l.type) break;

            // in some case we can got undefined points property
            if (undefined == l.points) break

            let str = ""
            let radiusesHash = {}
            l.points.forEach(function (point, index) {
                radiusesHash[point.cornerRadius] = true
            })
            if (Object.keys(radiusesHash).length == 1) {
                // all points have the same radius
                // skip zero radius
                if (0 == l.points[0].cornerRadius) break
                str = l.points[0].cornerRadius + "px"
            } else {

                str = l.points.map(p => p.cornerRadius).join("px ") + "px"
            }
            //
            res += spaces + "border-radius" + ": " + str + eol
            break
        }

        if (sStyle.opacity < 1) {
            res += spaces + "opacity" + ": " + Math.round(sStyle.opacity * 100) / 100 + eol
        }

        return res
    }


    _getLayerBorderByIndexAsText(sStyle, index, spaces) {
        const borders = sStyle.borders != null ? sStyle.borders.filter(s => s.enabled) : null
        const border = borders && (borders.length > index) ? borders[index] : null
        if (null == border) return ""
        let res = ""

        res += spaces + "border-color" + ": " + this._getColorToken(border.color) + eol
        //
        if (border.position != Style.BorderPosition.Center) {
            // save non-default position
            const conversion = {
                [Style.BorderPosition.Inside]: 'inside',
                [Style.BorderPosition.Outside]: 'outside'
            }
            res += spaces + "border-position" + ": " + conversion[border.position] + eol
        }
        //
        res += spaces + "border-width" + ": " + border.thickness + pxeol

        // Process styles common for all borders
        if (0 == index) {
            if (sStyle.borderOptions != null) {
                let bs = ""
                const dash = sStyle.borderOptions.dashPattern
                if (null != dash && dash.length) {
                    bs = dash[0] == border.thickness ? "dotted" : "dashed"
                }
                if (bs != "") res += spaces + "border-style" + ": " + bs + eol
            }
            //
            if (sStyle.borderOptions != null) {
                if (sStyle.borderOptions.lineEnd != Style.LineEnd.Butt) {
                    // save non-default line end
                    const borderLineEnd = bordedLineEndMap2[sStyle.borderOptions.lineEnd]
                    res += spaces + "border-line-end" + ": " + borderLineEnd + eol
                }
                if (sStyle.borderOptions.lineJoin != Style.LineJoin.Miter) {
                    // save non-default join
                    const borderLineJoin = bordedLineJoinMap2[sStyle.borderOptions.lineJoin]
                    if (undefined != borderLineJoin)
                        res += spaces + "border-line-join" + ": " + borderLineJoin + eol
                }
                const borderStartArrowHead = bordedArrowheadMap2[sStyle.borderOptions.startArrowhead]
                if ("none" != borderStartArrowHead)
                    res += spaces + "border-start-arrowhead" + ": " + borderStartArrowHead + eol
                const borderEndArrowHead = bordedArrowheadMap2[sStyle.borderOptions.endArrowhead]
                if ("none" != borderEndArrowHead)
                    res += spaces + "border-end-arrowhead" + ": " + borderEndArrowHead + eol
            }
        }
        //    

        return res
    }

    _getLayerFillByIndexAsText(sStyle, index, spaces) {
        const fills = sStyle.fills != null ? sStyle.fills.filter(s => s.enabled) : null
        const fill = fills && (fills.length > index) ? fills[index] : null
        if (null == fill) return ""

        let res = spaces + "background-color" + ": "
        if (Style.FillType.Color == fill.fill) {
            res += this._getColorToken(fill.color) + eol
        } else if (Style.FillType.Gradient == fill.fill) {
            const g = fill.gradient
            // fight with gradients
            if (Style.GradientType.Linear == g.gradientType) {
                //linear-gradient(134deg, #004B3A 0%, #2D8B61 51%, #9BD77E 100%);
                const deg = this._calcGradientDeg(g)
                res += "linear-gradient("
                if (180 != deg) {
                    // 180 is default, we can omit it
                    res += deg + "deg,"
                }
                g.stops.forEach(function (s, index) {
                    res += (index > 0 ? " ," : "") + this._getColorToken(s.color)
                }, this)
                res += ")" + eol
            }
        } else {
            return ""
        }
        //
        if (Style.BlendingMode.Normal != sStyle.blendingMode) {
            const cssValue = BLENDING_MODE_SKETCH_TO_CSS[sStyle.blendingMode]
            if (undefined == cssValue) {
                this.logError('Can not set CSS mix-blend-mode: for Sketch blendingMode ' + sStyle.blendingMode)
            } else {
                res += spaces + "mix-blend-mode: " + cssValue + eol
            }
        }
        //
        return res
    }

    _getLayerShadowsText(sStyle, spaces) {
        let t1 = this._getLayerTypeShadowsText(sStyle, sStyle.shadows, false, spaces)
        let t2 = this._getLayerTypeShadowsText(sStyle, sStyle.innerShadows, true, spaces)
        if ("" == t1 && "" == t2) return ""

        let res = spaces + "box-shadow: " + t1 + (t1 != "" && t2 != "" ? ", " : "")
        res += t2
        res += eol

        return res
    }


    _getLayerTypeShadowsText(sStyle, shadows, inset, spaces) {
        if (null == shadows || !shadows.length) return ""

        // to:
        // box-shadow:  0 10px 20px 2 rgba(0,0,0,0.1), inset 0 10px 20px 2 rgba(0,0,0,0.1);
        //           offset-x | offset-y | blur-radius | spread-radius | color 
        let res = ""
        shadows.filter(s => s.enabled).forEach(function (shadow, index) {
            if (index) res += ", "
            if (inset) res += "inset "
            res += shadow.x + 'px'
            if (null != shadow.y) {
                res += " " + shadow.y + "px"
                if (null != shadow.blur) {
                    res += " " + shadow.blur + "px"
                    if (null != shadow.spread) {
                        res += " " + shadow.spread
                    }
                }
            }

            res += " " + this._getColorToken(shadow.color)
        }, this)

        return res
    }


    // g: style.fills[0].gradient
    _calcGradientDeg(g) {
        const from = g.from
        const to = g.to

        let deg = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;

        // rotate for CSS 
        deg += 90
        // check for last 90
        if (deg < 0) deg = 360 + deg

        return Number.parseFloat(deg).toPrecision(6);
    }



    _parseStyleName(nameSrc, isText) {
        /*
        let styles = isText ? this.textStyles : this.layerStyles
        let index = 1
        let name = nameSrc
        while (name in styles) {
            name = nameSrc + "--PTD-" + index++
        }
        styles[name] = true
        */
        const name = nameSrc

        const path = name.split("/").map(s => s.replace(/\./g, '-DOT-').replace(/^(\d)/g, '--PT-$1'))
        let si = {
            openTags: "." + path.join(" .") + "{\n",
            spaces: "    ",
            closeTags: "}\n"
        }
        return si
    }



}
