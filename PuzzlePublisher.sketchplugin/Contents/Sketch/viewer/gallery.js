function createGallery() {
    return {        
        loaded: false,
        initialize: function()   {
        },
        show: function() {
            $('#gallery').removeClass('hidden');
            if(!this.loaded){
                this.loadPages();
                this.loaded = true;
            }
        },
        hide: function(){
            $('#gallery').addClass('hidden');
        },
        isVisible: function(){
            return ! $('#gallery').hasClass('hidden')
        },
        toogle: function(){
            if ( $('#gallery').hasClass('hidden')) {
                gallery.show();
            } else {
                gallery.hide();
            };
        },
        loadPages: function(){
            viewer.userStoryPages.forEach(function(page){
                this.loadOnePage(page);
            },this);
        },
        selectPage: function(index){
            gallery.hide();            
            viewer.goToPage(index);
        },
        loadOnePage: function(page){
            var imageURI = story.hasRetina && viewer.isHighDensityDisplay() ? page.image2x : page.image;	
            
            var width = 300;
            var height = Math.round(page.height / (page.width / width));

            var div = $('<div/>', {
                id : page.index,
                class: "gallery-div",                             
            });
            div.click(function(e){                
                gallery.selectPage(parseInt(this.id));
            });
            div.appendTo($('#gallery'));

            var img = $('<img/>', {
                id : "img_gallery_"+ page.index,
                class: "gallery-image",
                alt: page.title,
				src : encodeURIComponent(viewer.files) + '/previews/' + encodeURIComponent(imageURI),
            }).attr('width', width).attr('height', height);
            img.appendTo(div);

            var title = $('<span/>', {
                id: "page-title",
                alt: page.title,
                text: page.title,
            });
            title.appendTo(div);
        }
    }
}
