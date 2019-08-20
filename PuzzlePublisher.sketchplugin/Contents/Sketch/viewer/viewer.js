
// =============================== PRELOAD IMAGES =========================
var pagerLoadingTotal=0

function getQuery(uri,q) {
    return (uri.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
}

function doTransNext(){
	// get oldest transition
	const trans = viewer.transQueue[0]
	// if it still active then run it
	if(trans.active){
		viewer.next()
		console.log("RUN transition")
	}else{
		console.log("skip transition")
	}
	
	// remove this transtion from stack
	viewer.transQueue.shift()
}

$.fn.preload = function (callback) {
    var length = this.length;
    var iterator = 0;
  
    return this.each(function () {
      var self = this;
      var tmp = new Image();
  
      if (callback) tmp.onload = function () {
        callback.call(self, 100 * ++iterator / length, iterator === length);
        pagerMarkImageAsLoaded()
      };  
      tmp.src = this.src;
    });
  };

function pagerMarkImageAsLoaded(){
    console.log(pagerLoadingTotal);
    if(--pagerLoadingTotal==0){
        $("#loading").addClass("hidden")
    }
}

async function preloadAllPageImages(){
    $("#loading").removeClass("hidden")
    pagerLoadingTotal = story.totalImages
	var pages = story.pages;
	for(var page of story.pages){
		if(page.imageObj==undefined){
            page.loadImages()
            page.imageDiv.addClass("hidden")
		}
	}	
}

function reloadAllPageImages(){
	for(var page of story.pages){        
        page.imageObj.parent().remove();        
        page.imageObj = undefined
        for(var p of page.fixedPanels){
            p.imageObj.parent().remove(); 
            p.imageObj = undefined	
        }
    }	
    preloadAllPageImages()
}

function doBlinkHotspots(){
    viewer.toggleLinks()
}


// ============================ VIEWER ====================================

function createViewer(story, files) {
	return {
        highlightLinks: story.highlightLinks,
        symbolViewer: null,
        showLayout: false,
        isEmbed: false,

		prevPage: undefined,
        currentPage: undefined,
        lastRegularPage: undefined,

        currentMarginLeft: undefined,
        currentMarginTop: undefined,
        
        backStack: [],
        urlLastIndex: -1,
        handleURLRefresh : true,
        files: files,
        userStoryPages: [],
        zoomEnabled: story.zoomEnabled,
        sidebarVisible: false,

		transQueue : [],
		
		initialize: function() {
            this.initParseGetParams()
			this.buildUserStory();            

            if(story.layersExist){
                this.symbolViewer = new SymbolViewer()
            }

            this.addHotkeys();
            this.initializeHighDensitySupport();           
            
            window.addEventListener('mousemove', function (e) {
                viewer.onMouseMove(e.x,e.y)
            });
        },
        initParseGetParams : function() {
            var s = document.location.search
            if(s.includes('embed')){
                this.isEmbed = true
                // hide image preload indicator
                $('#loading').hide()
                // hide Navigation                
                $('.navCenter').hide()             
                $('.navPreviewNext').hide()
                $('#btnMenu').hide()
                $('#btnOpenNew').show()
            }
        },
		initializeHighDensitySupport: function() {
			if (window.matchMedia) {
				this.hdMediaQuery = window
						.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.1), only screen and (-o-min-device-pixel-ratio: 2.2/2), only screen and (-webkit-min-device-pixel-ratio: 1.1), only screen and (min-device-pixel-ratio: 1.1), only screen and (min-resolution: 1.1dppx)");
				var v = this;
				this.hdMediaQuery.addListener(function(e) {
					v.refresh();
				});
			}
		},
		isHighDensityDisplay: function() {
			return (this.hdMediaQuery && this.hdMediaQuery.matches || (window.devicePixelRatio && window.devicePixelRatio > 1));
        },		
        buildUserStory: function() {
            this.userStoryPages = []
			for(var page of story.pages){
				if('regular'==page.type || 'modal'==page.type){
                    page.userIndex = this.userStoryPages.length
                    this.userStoryPages.push(page)
                }else{
                    page.userIndex = -1
                }
            }	
		},
		addHotkeys: function() {
			var v = this;
			$(document).bind('keydown', 'right return', function() {
				v.next();
			});
			$(document).bind('keydown', 'left backspace', function() {
				v.previous();
			});
			$(document).bind('keydown', 'shift', function() {
				v.toggleLinks();
            });
            $(document).bind('keydown', 'z', function() {
				v.toggleZoom();
            });
            $(document).bind('keydown', 'e', function() {
				v.share();
			});
			$(document).bind('keydown', 'g', function() {
				gallery.toogle();
            });
            $(document).bind('keydown', 'l', function() {
				v.toogleLayout();
            });
            if(v.symbolViewer){
                $(document).bind('keydown', 'm', function() {
                    v.symbolViewer.toggle()
                })
            };
            
			$(document).bind('keydown', 's', function() {
                var first = v.getFirstUserPage()
                if(first && first.index!=v.currentPage.index) v.goToPage( first.index );
			});			
			$(document).keydown(function(event) {
				var ch = event.which
				if (ch == 27) {
					v.onKeyEscape()
					return false
				}	
			})						
        },
        
        blinkHotspots: function(){
            if(this.symbolViewer && this.symbolViewer.visible) return
            this.toggleLinks()
            setTimeout(doBlinkHotspots,500)
        },

        onMouseMove: function(x,y){
            if(this.currentPage) this.currentPage.onMouseMove(x,y)
        },

        onContentClick: function(){
            if(this.onKeyEscape()) return
            this.blinkHotspots()
        },
        onModalClick: function(){           
            this.blinkHotspots()
        },


        share: function(){
            var srcHref =  document.location.href
            var href = ''            

            if(document.location.search.includes('embed')){
                href = srcHref
            }else{
                href = srcHref.split('#')[0] + '?embed' + document.location.hash
            }            

            var page = undefined==this.lastRegularPage ? this.currentPage : this.lastRegularPage

            var iframe = '<iframe src="'+href+'" style="border: none;" noborder="0"'
            iframe += ' width="'+(story.iFrameSizeWidth?story.iFrameSizeWidth:page.width) + '"'
            iframe += ' height="'+(story.iFrameSizeHeight?story.iFrameSizeHeight:page.height) + '"'
            iframe += ' scrolling="auto" seamless id="iFrame1"></iframe>'

            iframe += '\n\n'

            var ihref = srcHref.substring(0, srcHref.lastIndexOf("/"))
            ihref = ihref+ "/images/"+page['image2x']
            iframe += "<a target='_blank' href='" + srcHref + "'>" + "<img border='0' "
            iframe += ' width="'+(story.iFrameSizeWidth?story.iFrameSizeWidth:page.width) + '"'
            //iframe += ' height="'+(story.iFrameSizeHeight?story.iFrameSizeHeight:page.height) + '"'
            iframe += "src='" +  ihref+ "'"
            iframe += "/></a>"

            alert(iframe)
        },

        toggleZoom: function(){
            this.zoomEnabled = !this.zoomEnabled
            this.zoomContent()
        },

        openNewWindow: function(){
            // remove GET parames from current URL 
            var cleanURL = window.location.origin 
            if(window.location.port!='') cleanURL = cleanURL + ":" + window.location.port
            cleanURL = cleanURL + window.location.pathname 
            if(window.location.hash!='') cleanURL = cleanURL + window.location.hash
            // ok, now open it in the new browse window
            window.open(cleanURL,"_blank")
        },

        zoomContent: function(){
            var page =this.lastRegularPage
            if(undefined==page) return


            if(undefined==this.marker){
                this.marker = $('#marker')
            }
            var marker = this.marker    
            
            var content = $('#content')
            //var contentShadow = $('#content-shadow')
            var contentModal= $('#content-modal')
            var elems = [content,contentModal] //,contentShadow
 
            var fullWidth = marker.innerWidth()
            var availableWidth = fullWidth
            var zoom = ""
            var scale = ""

            // check sidebar
            var sidebarWidth = 0
            if(this.sidebarVisible){
                var sidebar = $("#sidebar")
                var defSidebarWidth = 300

                sidebarWidth = Math.round((fullWidth - page.width) / 2)
                if(sidebarWidth<defSidebarWidth){
                    sidebarWidth = defSidebarWidth
                    availableWidth = fullWidth - sidebarWidth
                }                
                
                sidebar.css("margin-left",(fullWidth - sidebarWidth)+"px")
                sidebar.css("margin-top",(0)+"px")
                sidebar.css("width",sidebarWidth+"px")
                sidebar.css("height","100%")
            }


            if(this.zoomEnabled && availableWidth<page.width){                
                zoom = availableWidth / page.width
                scale = "scale("+zoom+")"
            } 

            var newZoom = zoom!=''?(zoom+0):1
                        
            if(undefined==this.currentZoom || this.currentZoom!=newZoom){
                for(var el of elems){
                    el.css("zoom",zoom)
                    el.css("-moz-transform",scale)                
                }
                content.css("-moz-transform-origin","left top")
                contentModal.css("-moz-transform-origin","center top")
    
            }

            this.currentZoom  = newZoom
                   
            // Calculate margins
            this.currentMarginLeft =  Math.round(availableWidth / 2 )  -  Math.round(page.width / 2 * this.currentZoom)
            this.currentMarginTop = 0

            // Set content to new left positions
            content.css("margin-left",this.currentMarginLeft+"px")
            content.css("margin-top",this.currentMarginTop+"px")
            this.currentPage.updatePosition()
        },

		getPageHashes: function() {
			if(this.pageHashes == null) {
				var hashes = {};
                for(var page of story.pages){
                    hashes[page.getHash()] = page.index;
                }
				this.pageHashes = hashes;
			}
			return this.pageHashes;
		},
		getModalFirstParentPageIndex: function(modalIndex){
			var page = null;
			var link = null;
			for(var i=story.pages.length-1; i>=0 ;i --) {
				page = story.pages[i];
				if(page.type==='modal') continue;
				for(var li = 0; li < page.links.length; li ++) {
					link = page.links[li];
					if(link.page!=null && link.page==modalIndex){
                        // check if the source link is in overlay?
                        if(page.type==='overlay'){
                            // ok, now find the source page for this overlay
                            return this.getModalFirstParentPageIndex(i)
                        }
						// return the page index which has link to modal
						return i;
					}
				}
			}
			// return first prototype page
			return 0;
		},
		getPageIndex: function(page,defIndex=0) {
			var index;

			if (typeof page === "number") {
				index = page;
			} else if (page === "") {
				index = defIndex;
			} else {
				index = this.getPageHashes()[page];
				if (index==undefined) {
					index = defIndex;
				}
			}
			return index;
		},
		goBack: function() { 
			if(this.backStack.length>0){
				this.goTo(this.backStack[this.backStack.length-1]);
                this.backStack.shift();
            }else if (this.currentPage.isModal  && this.lastRegularPage){
                this.goTo(this.lastRegularPage.index);
			}else{
				window.history.back();
			}
		},
		goToPage : function(page) {
			this.clear_context();
			this.goTo(page);
		},
		goTo : function(page,refreshURL=true) {
			// We don't need any waiting page transitions anymore
            this._resetTransQueue()

            if(this.symbolViewer) this.symbolViewer.hide()
            
            var index = this.getPageIndex(page);
            var currentPage = this.currentPage

			if(currentPage && !currentPage.isModal){
				this.backStack.push(currentPage.index);
			}

            var oldcurrentPageModal  = currentPage && currentPage.isModal
			
			if(index <0 ||  (currentPage && index == currentPage.index) || index >= story.pages.length) return;

            
			var newPage = story.pages[index];
			if(newPage.type==="modal"){                
                // hide parent page links hightlighting
                this._updateLinksState(false, $('#content'))

				// no any page visible now, need to find something
				if(undefined==currentPage){
					var parentIndex = this.getModalFirstParentPageIndex(index);					
					this.goTo(parentIndex,false);
                    this.zoomContent()
				}
                
                // redraw modal links hightlighting
                this._updateLinksState()
			}else{
                if(oldcurrentPageModal){
                    // hide modal page links hightlighting
                    this._updateLinksState(false, $('#content-modal'))
                    this._updateLinksState(undefined,$('#content'))
                }
			}
            this.prevPage = currentPage		
            var prevRegularPage = this.lastRegularPage

            newPage.show()                   

            this.refresh_adjust_content_layer(newPage);	              
            this.refresh_hide_last_image(newPage)                       
			this.refresh_switch_modal_layer(newPage);	
			this.refresh_update_navbar(newPage);			
			if(refreshURL)this.refresh_url(newPage)			


            this.currentPage = newPage;
			if(!newPage.isModal){
				this.lastRegularPage = newPage
            }
            
            // zoom content if the new page dimensions differ from the previous
            if(!newPage.isModal){
                if(prevRegularPage){
                    if(newPage.width!=prevRegularPage.width || newPage.height!=prevRegularPage.height)
                        this.zoomContent()
                }
            }


			if(newPage.transNextMsecs!=undefined){				
				this._setupTransNext(newPage.transNextMsecs)
            }
            
            if(!newPage.disableAutoScroll){
               window.scrollTo(0,0)       
            }                 
								
        },
		_setupTransNext: function(msecs){	
			// deactivate all waiting transitions
			for(var trans of this.transQueue){
				trans.active = false	
			}
			// place new active transition over the top of stack
			this.transQueue.push({
				page: this.currentPage,
				active: true
			})
			// set timer in milisecs
			setTimeout(doTransNext,msecs)
		},
		// Deactivate all waiting transitions
		_resetTransQueue: function(){	
			for(var trans of this.transQueue){
                trans.active = false	
            }			
		},
		refresh_update_navbar: function(page) {
			var VERSION_INJECT="";
            
            var prevPage = this.getPreviousUserPage(page)
            var nextPage = this.getNextUserPage(page)

			$('#nav .title').html((page.userIndex+1) + '/' + this.userStoryPages.length + ' - ' + page.title + VERSION_INJECT);
			$('#nav-left-prev').toggleClass('disabled', !prevPage)
			$('#nav-left-next').toggleClass('disabled', !nextPage)			
			
			if(prevPage) {
				$('#nav-left-prev a').attr('title', prevPage.title);
			} else {
				$('#nav-left-prev a').removeAttr('title');
			}
			
			if(nextPage) {
				$('#nav-left-next a').attr('title', nextPage.title);
			} else {
				$('#nav-left-next a').removeAttr('title');
			}

			$('#nav-right-hints').toggleClass('disabled', page.annotations==undefined);

			this.refresh_update_links_toggler(page);			
		},
		refresh_update_links_toggler: function(page) {
			$('#nav-right-links').toggleClass('active', this.highlightLinks);
			$('#nav-right-links').toggleClass('disabled', page.links.length == 0);
		},
		refresh_hide_last_image: function(page){
			var content = $('#content');
			var contentModal = $('#content-modal');		
			var isModal = page.isModal

			// hide last regular page to show a new regular after modal
			if(!isModal && this.lastRegularPage && this.lastRegularPage.index != page.index){
				var lastPageImg = $('#img_'+this.lastRegularPage.index);
				if(lastPageImg.length){
					this.lastRegularPage.hide()					
				}
			}

			// hide last modal 
			var prevPageWasModal = this.prevPage && this.prevPage.isModal
			if(prevPageWasModal){
				var prevImg = $('#img_'+this.prevPage.index);
				if(prevImg.length){
					this.prevPage.hide()
					//pagerHideImg(prevImg)
				}
			}
			
		},
		refresh_adjust_content_layer: function(page){
            if(page.isModal) return;

			var contentShadow = $('#content-shadow');
			var contentModal = $('#content-modal');
			var content = $('#content');

            var prevPageWasModal = this.prevPage && this.prevPage.isModal
			if(prevPageWasModal){
				contentShadow.addClass('hidden');
				contentModal.addClass('hidden');
			}         

		},

		refresh_switch_modal_layer: function(page){			
			if(!page.isModal) return;

			var showShadow = page.showShadow==1;	
			var contentModal = $('#content-modal');		
			var contentShadow = $('#content-shadow');				
			
			if(showShadow){				
				contentShadow.removeClass('no-shadow');
				contentShadow.addClass('shadow');
				contentShadow.removeClass('hidden');
			}else{
				contentModal.addClass('hidden');								
			}
			contentModal.removeClass('hidden');			
		},
    
        refresh_url: function(page,extURL=null) {
            this.handleURLRefresh = false

			this.urlLastIndex = page.index
            $(document).attr('title', story.title + ': ' + page.title)

            if(null==extURL) extURL = ''

            location.hash = '#' 
                + encodeURIComponent(page.getHash())
                + extURL

		},
        
        _parseLocationHash : function(){
            var result = {
                reset_url : false
            }
            var hash = location.hash;
            
            if(hash == null || hash.length == 0){
                hash = '#'
                result.reset_url = true
                
            }else if(hash.indexOf('/')>0){
                // read additonal parameters
                var args = hash.split('/')
                // check for link to click
                if(args[1]=='o'){
                    result.overlayLinkIndex = args[2]                                    
                }
                hash = hash.substring(0,hash.indexOf('/'))
                hash = '#' + hash.replace( /^[^#]*#?(.*)$/, '$1' );
            }

            result.hash = hash
            return result
        },

        handleNewLocation : function(initial){
            var hashInfo = this._parseLocationHash()	
        
            var pageName = hashInfo.hash.substring(1)
            var pageIndex = this.getPageIndex(pageName,null);
            if(null==pageIndex){
                // get the default page
                pageIndex = 0
                hashInfo.reset_url = true
            }

            if(!initial && this.urlLastIndex==pageIndex){
                return
            }

            var page =  story.pages[pageIndex];            

            if(initial)
                page.isDefault = true
            else
                this.clear_context();
            
            this.goTo(pageIndex,hashInfo.reset_url);
            
            if(hashInfo.overlayLinkIndex!=null){
                page.showOverlayByLinkIndex(hashInfo.overlayLinkIndex)
            }

            if(!initial) this.urlLastIndex = pageIndex
        },
 
		clear_context_hide_all_images: function(){
			var page = this.currentPage;
			var content = $('#content');
			var contentModal = $('#content-modal');		
			var contentShadow = $('#content-shadow');
			var isModal = page && page.type==="modal";

			contentShadow.addClass('hidden');
			contentModal.addClass('hidden');
						
			// hide last regular page
			if(this.lastRegularPage){
				var lastPageImg = $('#img_'+this.lastRegularPage.index);
				if(lastPageImg.length){
					this.lastRegularPage.hide()
				}
			}

			// hide current modal 
			if(isModal){
				var modalImg = $('#img_'+this.currentPage.index);
				if(modalImg.length){
					this.currentPage.hide()
				}
			}
			
		},

		clear_context: function(){
			this.clear_context_hide_all_images()

            this.prevPage = undefined
            this.currentPage = undefined
            this.lastRegularPage = undefined
            
			this.backStack = []
		},

		refresh: function(){
			reloadAllPageImages()
			this.currentPage.show()
		},
		onKeyEscape: function(){
			// If gallery is enabled then close it
			if(gallery.isVisible()){
				gallery.toogle()
				return true
            }
            // If the current page has some overlay open then close it
            const page = this.currentPage            
            if(page.hideCurrentOverlays()){
                return true
            }
			// If the current page is modal then close it and go to the last non-modal page
			if(this.currentPage.isModal){
                viewer.goBack()               
			    return true
            }
            return false
		},
		next: function() {
            var page = this.getNextUserPage( this.currentPage )
            if(!page) return
			this.goToPage(page.index);	
		},
		previous : function() {
            var page = this.getPreviousUserPage( this.currentPage )
            if(!page) return
			this.goToPage(page.index);	
        },
        getFirstUserPage : function() {           
            var first = this.userStoryPages[0]
            return first?first:null
		},
		getNextUserPage : function(page) {
            var nextUserIndex = page ? page.userIndex + 1 : 0
            if(nextUserIndex>=this.userStoryPages.length) return null
            return this.userStoryPages[ nextUserIndex ] 
		},
		getPreviousUserPage : function(page) {
            var prevUserIndex = page ? page.userIndex - 1 : -1
            if(prevUserIndex<0) return null
            return this.userStoryPages[ prevUserIndex ] 
		},
		toggleLinks : function(newState=undefined) {
            this.highlightLinks = newState!=undefined?newState:!this.highlightLinks
            this.refresh_update_links_toggler(this.currentPage)
            this._updateLinksState()
        },

        toogleLayout : function(newState=undefined) {
            this.showLayout = newState!=undefined?newState:!this.showLayout
            div = $('#content')

            if(this.showLayout ){
                this.currentPage.showLayout()
                div.addClass("contentLayoutVisible")
            }else
                div.removeClass("contentLayoutVisible")        
        },

        

        _updateLinksState : function(showLinks = undefined, div = undefined){
            if(undefined == div){
                if(this.currentPage.isModal){
                    div = $('#content-modal')
                }else{
                    div = $('#content')
                }
            }
            if(undefined == showLinks) showLinks = this.highlightLinks
            if(showLinks)
                div.addClass("contentLinksVisible")
            else
                div.removeClass("contentLinksVisible")        
        },
                
		showHints : function(){
			var text = this.currentPage.annotations;
			if(text==undefined) return;
			alert(text);
		},
		hideNavbar : function() {
			$('#nav').slideToggle('fast', function() {
				$('#nav-hide').slideToggle('fast').removeClass('hidden');
			});
		},
		showNavbar : function() {
			$('#nav-hide').slideToggle('fast', function() {
				$('#nav').slideToggle('fast');
			}).addClass('hidden');
		}
	};
}

// ADD | REMOVE CLASS
// mode ID - getELementByID
// mode CLASS - getELementByClassName

function addRemoveClass(mode, el, cls) {
	
	var el;

	switch(mode) {
		case 'class':
		el = document.getElementsByClassName(el)[0];
		break;

		case 'id':
		el = document.getElementById(el);
		break;
	}

	if (el.classList.contains(cls)) {
		el.classList.remove(cls)
	} else {
		el.classList.add(cls);
	}
}


$(document).ready(function() {
    viewer.initialize();
    gallery.initialize();		
	
	if(!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) {
		$('body').removeClass('screen');
	}
    
    viewer.handleNewLocation(true)

    if(!viewer.isEmbed) preloadAllPageImages();
	
	$(window).hashchange(function(e) {
        if(viewer.handleURLRefresh)
            viewer.handleNewLocation(false)       
        viewer.handleURLRefresh = true
	});
    //$(window).hashchange();
    viewer.zoomContent()
});
