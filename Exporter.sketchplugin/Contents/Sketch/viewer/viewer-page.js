
///

function inViewport($el) {
    var elH = $el.outerHeight(),
        H   = $(window).height(),
        r   = $el[0].getBoundingClientRect(), t=r.top, b=r.bottom;
    return Math.max(0, t>0? Math.min(elH, H-t) : Math.min(b, H));
}

class ViewerPage {

    constructor(){
        this.currentOverlays = {}
        this.parentPage = undefined
    
        this.image = undefined
        this.imageDiv = undefined
        this.imageObj = undefined

        this.currentLeft = undefined
        this.currentTop = undefined

        this.currentX = undefined
        this.currentY = undefined

        this.overlayByEvent = undefined
        this.tmpSrcOverlayByEvent = undefined
    }
    
	getHash(){
        var image = this.image;
        return image.substring(0, image.length - 4); // strip .png suffix
    }

    hide(hideChilds=false){             
        this.imageDiv.addClass("hidden")
        
        if(undefined != this.parentPage){ // current page is overlay      
            
            if(hideChilds) this.hideChildOverlays()            

            const parent = this.parentPage
            viewer.refresh_url(parent)
            delete parent.currentOverlays[this.index]
            this.parentPage = undefined
        }else{
            this.hideCurrentOverlays()
        }

        if(undefined != this.tmpSrcOverlayByEvent){
            this.overlayByEvent  = this.tmpSrcOverlayByEvent
            this.tmpSrcOverlayByEvent = undefined
        }
    }

    hideCurrentOverlays(){
        for(let [index,overlay] of Object.entries(this.currentOverlays)){
            overlay.hide()
        }   
    }

    hideChildOverlays(){
        for(let [index,overlay] of Object.entries(this.parentPage.currentOverlays)){
            if(overlay.currentLink.orgPage!=this) continue
            overlay.hide()
        }   
    }
    

    show(){
        if(!this.imageObj) this.loadImages(true)						
        
        this.updatePosition()
        
        this.imageDiv.removeClass("hidden")
    }

    updatePosition(){    
        this.currentLeft =  viewer.currentMarginLeft
        this.currentTop = viewer.currentMarginTop

        if( this.isModal ){
            var regPage = viewer.lastRegularPage          

            this.currentLeft += Math.round(regPage.width / 2) -  Math.round(this.width / 2)
            this.currentTop +=  Math.round(inViewport(regPage.imageDiv) /2 ) -  Math.round(this.height / 2 * viewer.currentZoom)
            if(this.currentTop<0) this.currentTop = 0
            if(this.currentLeft<0) this.currentLeft = 0
            
            var contentModal = $('#content-modal');
            contentModal.css("margin-left",this.currentLeft+"px")
            contentModal.css("margin-top",this.currentTop+"px")
        }else if( "overlay"==this.type ){
            this.currentLeft = viewer.currentPage.currentLeft
            this.currentTop = viewer.currentPage.currentTop
        }
    }

    showOverlayByLinkIndex(linkIndex){
        linkIndex = parseInt(linkIndex,10)

        var link = this._getLinkByIndex(linkIndex)
        if(!link){
            console.log('Error: can not find link to overlay by index="'+linkIndex+'"')
            return false
        }

        // can handle only page-to-page transition
        if((link["page"]==undefined)) return false
         
        var destPage = story.pages[ link.page ] 
        // for mouseover overlay we need to show it on click, but only one time)
        if("overlay"==destPage.type && 1==destPage.overlayByEvent){            
            destPage.tmpSrcOverlayByEvent =  destPage.overlayByEvent
            destPage.overlayByEvent = 0 
            viewer.customEvent = {
                x:link.rect.x,
                y:link.rect.y,
                pageIndex:this.index,
                linkIndex:link.index
            }
            handleLinkEvent({})
            viewer.customEvent = undefined
        }else{
            link.a.click()    
        }
    }

    // return true (overlay is hidden) or false (overlay is visible)
    onMouseMove(x,y){
        for(let [index,overlay] of Object.entries(this.currentOverlays)){
            if(overlay.currentLink.orgPage!=this) continue
            overlay.onMouseMoveOverlay(x,y)       
        }
    }

    // return true (overlay is hidden) or false (overlay is visible)
    onMouseMoveOverlay(x,y){
        if(this.imageDiv.hasClass("hidden") || this.overlayByEvent!=1) return false

        // handle mouse hover if this page is overlay
        var hideSelf = false
        while(1==this.overlayByEvent){
            var localX =  Math.round( x / viewer.currentZoom) -  this.currentLeft
            var localY =  Math.round( y / viewer.currentZoom) -  this.currentTop
            //alert(" localX:"+localX+" localY:"+localY+" linkX:"+this.currentLink.x+" linkY:"+this.currentLink.y);
            

            if( // check if we inside in overlay
                    localX >= this.currentX          
                &&  localY >= this.currentY
                &&  localX < (this.currentX + this.width)
                &&  localY < (this.currentY + this.height)
            ){
                break
            }
            
            if( // check if we out of current hotspot
                    localX < this.currentLink.x            
                ||  localY < this.currentLink.y    
                ||  localX >= (this.currentLink.x + this.currentLink.width)
                ||  localY >= (this.currentLink.y + this.currentLink.height)
            ){
                hideSelf = true
                break
            }
            break
        }
        
        // allow childs to handle mouse move
        var visibleTotal = 0
        var total = 0

        for(let [index,overlay] of Object.entries(this.parentPage.currentOverlays)){
            if(overlay.currentLink.orgPage!=this) continue
            total++
            if(overlay.onMouseMoveOverlay(x,y)) visibleTotal++            
        }

        if(hideSelf)
            if(!total || (total && !visibleTotal)){
                this.hide(false)
                return false
            }

        return true
    }


    showAsOverlayInCurrentPage(orgPage,link,posX,posY,linkParentFixed){
        const newParentPage = viewer.currentPage    

        if( !this.imageDiv ){
            this.loadImages(true)
        }

        // check if we need to hide any other already visible overlay
        var positionCloned = false
        const currentOverlays = newParentPage.currentOverlays
        
        if( !currentOverlays[this.index] )
        {
            if('overlay'!==link.orgPage.type){
                for(let [index,overlay] of Object.entries(currentOverlays)){
                    overlay.hide()
                }
            }
            /*if('overlay'==linkPageType){
                posX = currentOverlay.currentX
                posY = currentOverlay.currentY
                positionCloned = true
            }else{
                newParentPage.currentOverlayPage.hide()                     
            }
            */
            //newParentPage.currentOverlayPage = undefined
        }

        // Show overlay on the new position
        const div = this.imageDiv        

        // 
        this.inFixedPanel = linkParentFixed && this.overlayAlsoFixed
        if(div.parent().attr('id')!=newParentPage.imageDiv.attr('id') || div.hasClass('hidden') ){

            if(this.inFixedPanel){
                div.removeClass('divPanel')
                div.addClass('fixedPanelFloat')
            }else if(newParentPage.isModal){
                //div.removeClass('divPanel')
                //div.removeClass('fixedPanelFloat')        
            }else{                
                div.removeClass('fixedPanelFloat')
                div.addClass('divPanel')
            }

            if(!positionCloned && undefined!=this.overlayShadowX && 10==this.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT
                posX -= this.overlayShadowX
            }

            this.currentX = posX
            this.currentY = posY
            
            newParentPage.imageDiv.append(div)
            div.css('top',posY+"px")        
            div.css('margin-left',posX+"px")
            
            this.show()
            newParentPage.currentOverlays[this.index] = this // add this as new overlay to parent overlays
            this.parentPage = newParentPage
            
            this.currentLink = link

            var extURL = '/o/'+link.index
            viewer.refresh_url(newParentPage,extURL)            


        }else if(1==this.overlayByEvent && posX==this.currentX && posY==this.currentY){//handle only mouse hover
            // cursor returned back from overlay to hotspot -> nothing to do
        }else{           
            this.hide()
            viewer.refresh_url(newParentPage)
        }       
    }

    loadImages(force=false){
        /// check if already loaded images for this page
        if(!force && this.imageObj!=undefined){     
            return pagerMarkImageAsLoaded()
        }

        const enableLinks = true
        var isModal = this.type==="modal";
        
        var content = $('#content')        
        var cssStyle = "height: "+this.height+"px; width: "+this.width+"px;"
        if(this.overlayShadow!=undefined)
            cssStyle+="box-shadow:"+this.overlayShadow+";"
        if('overlay'==this.type && this.overlayOverFixed)
            cssStyle+="z-index: 50;"            
        var imageDiv = $('<div>',{
            class:('overlay'==this.type)?"divPanel":"image_div", 
            id:"div_"+this.index,
            style:cssStyle
        });
        this.imageDiv = imageDiv
    

        // create fixed panel images        
        for(var panel of this.fixedPanels){
            let style="height: "+panel.height+"px; width: "+panel.width+"px; " 
            if(panel.constrains.top || panel.isFixedDiv || (!panel.constrains.top && !panel.constrains.bottom)){
                style+="top:"+panel.y+"px;"
            }else if(panel.constrains.bottom){
                style+="bottom:"+(this.height - panel.y- panel.height)+"px;"
            }
            if(panel.constrains.left  || panel.isFixedDiv || (!panel.constrains.left  && !panel.constrains.right)){
                style+="margin-left:"+panel.x+"px;"
            }else if(panel.constrains.right){
                style+="margin-left:"+panel.x+"px;"
            }
            //

            if(panel.shadow!=undefined)
                style+="box-shadow:"+panel.shadow+";"
            
                // create Div for fixed panel
            var cssClass = ""
            if(panel.isFloat){
                cssClass = 'fixedPanelFloat'
            }else if(panel.isFixedDiv){
                cssClass = 'divPanel'
            }else if("top" ==panel.type){
                cssClass = 'fixedPanel fixedPanelTop'
            }else if("left" == panel.type){
                cssClass = 'fixedPanel'
            }

            var divID = panel.divID!=''?panel.divID:("fixed_"+this.index+"_"+panel.index)

            var panelDiv = $("<div>",{
                id:divID,
                class:cssClass,
                style:style
            });
            //panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
            panelDiv.appendTo(imageDiv);
            panel.imageDiv = panelDiv

            // create link div
            panel.linksDiv = $("<div>",{                
                class:"linksDiv",
                style:"height: "+panel.height+"px; width: "+panel.width+"px;"
            })
            panel.linksDiv.appendTo(panel.imageDiv)            
            this._createLinks(panel)

            // add image itself
            panel.imageObj = this._loadSingleImage(panel.isFloat || panel.isFixedDiv?panel:this,'img_'+panel.index+"_")     
            panel.imageObj.appendTo(panelDiv);            
            if(!this.isDefault) panel.imageObj.css("webkit-transform","translate3d(0,0,0)")
        }
        
        // create main content image      
        {
            var isModal = this.type==="modal";
            var contentModal = $('#content-modal');		            
            imageDiv.appendTo(isModal?contentModal:content);	
            
            // create link div
            if(enableLinks){
                var linksDiv = $("<div>",{
                    id:"div_links_"+this.index,
                    class:"linksDiv", 
                    style:"height: "+this.height+"px; width: "+this.width+"px;"                   
                })
                linksDiv.appendTo(imageDiv)
                this.linksDiv = linksDiv

                this._createLinks(this)
            }
        }
        var img = this._loadSingleImage(this,'img_')		 
        this.imageObj = img
        img.appendTo(imageDiv) 
    }   

    showLayout(){
        if(undefined==this.layoutCreated){
            this.layoutCreated = true
            this._addLayoutLines(this.imageDiv) 
        }
    }

    _addLayoutLines(imageDiv){
        if( this.type!="regular" ||  undefined==this.layout) return
 
        var x = this.layout.offset
        var colWidth = this.layout.columnWidth
        var colWidthInt = Math.round(this.layout.columnWidth)
        var gutterWidth = this.layout.gutterWidth
        for(var i = 0;i<this.layout.numberOfColumns;i++){
            var style="left: "+ Math.trunc(x)+"px; top:"+0+"px; width: " + colWidthInt + "px; height:"+this.height+"px; "
            var colDiv = $("<div>",{
                class:"layoutColDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv) 
            x += colWidth + gutterWidth
        }

        for(var y = 0;y<this.height;y+=5){
            var style="left: "+ 0 +"px; top:"+y+"px; width: "+ this.width +"px; height:"+ 1 +"px; "
            var colDiv = $("<div>",{
                class:"layoutRowDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv) 
        }
    }


    /*------------------------------- INTERNAL METHODS -----------------------------*/
    _getLinkByIndex(index){
        var link = this._getLinkByIndexInLinks(index,this.links)
        if(link!=null) return link
        for(var panel of this.fixedPanels){
            link = this._getLinkByIndexInLinks(index,panel.links)
            if(link!=null) return link
        }
        return null
    }

    _getLinkByIndexInLinks(index,links){
        var found = links.find(function(el){
            return el.index==index
        })
        return found!=undefined?found:null
    }


    _loadSingleImage(sizeSrc,idPrefix){
        var hasRetinaImages = story.hasRetina
        var imageURI = hasRetinaImages && viewer.isHighDensityDisplay() ? sizeSrc.image2x : sizeSrc.image;	
        var unCachePostfix = "V_V_V"==story.docVersion?"":("?"+story.docVersion)

        var img = $('<img/>', {
            id : idPrefix+this.index,
            class: "pageImage",
            src : encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI)+unCachePostfix,		
        }).attr('width', sizeSrc.width).attr('height', sizeSrc.height);

        img.preload(function(perc, done) {
        console.log(perc, done);
        });
        return img;
    } 
 
    // panel: ref to panel or this
    _createLinks(panel){
        var linksDiv = panel.linksDiv
        
        for(var link of panel.links) {
            let x = link.rect.x + (link.isParentFixed?panel.x:0)
            let y = link.rect.y + (link.isParentFixed?panel.y:0)

            var a = $("<a>",{                
                lpi: this.index,
                li: link.index,
                lpx:  x,
                lpy:  y
            })

            var eventType = 0 // click

            if('page' in link){
                var destPageIndex = viewer.getPageIndex(parseInt(link.page))
                var destPage = story.pages[destPageIndex];
                if('overlay'==destPage.type){
                    eventType = destPage.overlayByEvent
                }
            }

            
            if(1==eventType){ // for Mouse over event
                a.mouseenter(handleLinkEvent)
                if(10==destPage.overlayAlign){ // for overlay on hotspot top left position
                    
                }else{
                    // need to pass click event to overlayed layers
                    a.click(function(e){
                        if(undefined==e.originalEvent) return
                        var nextObjects = document.elementsFromPoint(e.originalEvent.x,e.originalEvent.y);
                        for(var i = 0; i < nextObjects.length; i++) {
                            var obj = nextObjects[i].parentElement
                            if(obj.nodeName!='A' || obj==this) continue
                            $(obj).trigger('click', e);
                            return
                        }
                    })
                }
            }else{ // for On click event
                a.click(handleLinkEvent)
            }
            
            a.appendTo(linksDiv)

            link.a = a

            var style="left: "+ link.rect.x+"px; top:"+link.rect.y+"px; width: "+ link.rect.width+"px; height:"+link.rect.height+"px; "
            var linkDiv = $("<div>",{
                class:"linkDiv"+(story.disableHotspots?"":" linkDivHighlight"),
            }).attr('style', style)
            linkDiv.appendTo(a)

            link.div = linkDiv
            
        } 
    }
}

//
// customData:
//  x,y,pageIndex
function handleLinkEvent(event){
    var customData = viewer["customEvent"]

    if(viewer.linksDisabled) return false

    const currentPage = viewer.currentPage
    const orgPage = customData?story.pages[customData.pageIndex]:story.pages[ $(this).attr("lpi") ]

    const linkIndex = customData?customData.linkIndex:$( this ).attr("li") 
    const link = orgPage._getLinkByIndex(linkIndex)
           
    if(link.page != undefined) {			
        var destPageIndex = parseInt(link.page)
        var linkParentFixed = "overlay"!=orgPage.type?link.isParentFixed:orgPage.inFixedPanel
        

        // title = story.pages[link.page].title;                   
        var destPage = story.pages[destPageIndex]
        if(!destPage) return

        if('overlay'==destPage.type){
            var orgLink = {
                orgPage : orgPage,
                index:    linkIndex ,
                this:  $( this ),
                x : customData?customData.x:parseInt($( this ).attr("lpx")),
                y : customData?customData.y:parseInt($( this ).attr("lpy")),
                width: link.rect.width,
                height: link.rect.height
            }

            // clicked from some other overlay
            if('overlay'==orgPage.type){
                orgLink.x += orgPage.currentX
                orgLink.y += orgPage.currentY
            }

            var pageX = orgLink.x
            var pageY = orgLink.y

            var offsetX = destPage.overlayAlign <= 2 ? 5 : 0
            

            if(0==destPage.overlayAlign){ // align on hotspot left  
                pageY += link.rect.height
            }else if(1==destPage.overlayAlign){ // align on hotspot center                                                
                pageX += parseInt(orgLink.width/2) - parseInt(destPage.width/2)
                pageY += link.rect.height
            }else if(2==destPage.overlayAlign){// align on hotpost right
                pageX += orgLink.width  - destPage.width
                pageY += link.rect.height
            }else if(3==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_LEFT
                pageX = 0
                pageY = 0
            }else if(4==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_CENTER
                pageX = parseInt(orgPage.width / 2) - parseInt(destPage.width / 2)
                pageX = 0
            }else if(5==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                pageX = orgPage.width - destPage.width
                pageX = 0
            }else if(6==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_CENTER
                pageX = parseInt(orgPage.width / 2) - parseInt(destPage.width / 2)
                pageY = parseInt(orgPage.height / 2) - parseInt(destPage.height / 2)
            }else if(7==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_LEFT
                pageX = 0
                pageY = orgPage.height - destPage.height
            }else if(8==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_CENTER
                pageX = parseInt(orgPage.width / 2) - parseInt(destPage.width / 2)
                pageY = orgPage.height - destPage.height
            }else if(9==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                pageX = orgPage.width - destPage.width
                pageY = orgPage.height - destPage.height
            }else if(10==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT                                                    
            }else if(11==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_CENTER
                pageX += parseInt(orgLink.width/2) - parseInt(destPage.width/2)
                pageY -= destPage.height                            
            }else if(12==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT
                pageX += orgLink.width  - destPage.width
                pageY = pageY - destPage.height                            
            }else if(13==destPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT_ALIGN_RIGHT
                pageX +=orgLink.width
            }

            // check page right side
            if(10!=destPage.overlayAlign){// NOT ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT
                const fullWidth = destPage.width + offsetX // + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0)
                if( (pageX+fullWidth)>currentPage.width )
                    pageX = currentPage.width - fullWidth

                /*if(linkPosX < (offsetX + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0))){  
                    linkPosX = offsetX + (('overlayShadowX' in destPage)?destPage.overlayShadowX:0)
                }*/
            }

            if(pageX<0) pageX = 0
            if(pageY<0) pageY = 0
                    
            destPage.showAsOverlayInCurrentPage(orgPage,orgLink,pageX,pageY,linkParentFixed)
            return false
        }else{
            viewer.goTo(parseInt(destPageIndex))
            return false
        }
    } else if(link.action != null && link.action== 'back') {
        //title = "Go Back";
        viewer.currentPage.hideCurrentOverlays()
        viewer.goBack()
        return false
    } else if(link.url != null){
        //title = link.url;
        viewer.currentPage.hideCurrentOverlays()
        var target = link.target
        window.open(link.url,target!=undefined?target:"_self")                    
        return false
        //document.location = link_url
        //target = link.target!=null?link.target:null;		
    }

    // close last current overlay if it still has parent
    if('overlay'==orgPage.type && undefined!=orgPage.parentPage){
        orgPage.hide()
    }

    return false
}
