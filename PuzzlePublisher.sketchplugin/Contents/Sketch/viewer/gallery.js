function createGallery() {
    return {
        loaded: false,
        initialize: function()   {
        },
        show: function() {
            $('#gallery-modal').removeClass('hidden');
            if(!this.loaded){
                this.loadPages();
                this.loaded = true;
                //load amount of pages to gallery title
                document.getElementById("screensamount").innerHTML = viewer.userStoryPages.length + " screens";
            }
        },
        hide: function(){
            $('#gallery-modal').addClass('hidden');
        },
        isVisible: function(){
            return ! $('#gallery-modal').hasClass('hidden')
        },
        toogle: function(){
            if ( $('#gallery-modal').hasClass('hidden')) {
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

            var div = $('<div/>', {
                id : page.index,
                class: "grid-cell",
            });

            var divWrapper = $('<div/>', {
                class: "grid-cell-wrapper"
            });
            var divMain = $('<div/>', {
                class: "grid-cell-main"
            });
            div.click(function(e){
                gallery.selectPage(parseInt(this.id));
            });
            div.appendTo($('#grid'));

            var img = $('<img/>', {
                id : "img_gallery_"+ page.index,
                class: "gallery-image",
                alt: page.title,
				src : encodeURIComponent(viewer.files) + '/previews/' + encodeURIComponent(imageURI),
            });

            img.appendTo(divMain);
            divMain.appendTo(divWrapper);
            divWrapper.appendTo(div);

            var title = $('<span/>', {
                id: "page-title",
                alt: page.title,
                text: page.title,
            });
            title.appendTo(divMain);
        }
    }
}

//Search page in gallery by page name
function searchScreen(){
  var screens = document.getElementsByClassName("grid-cell");
  var keyword = document.getElementById("searchInput").value.toLowerCase();
  var screensAmount = 0;
  for (var i = 0; i < screens.length; i++){
    var screenName = screens[i].getElementsByTagName("span")[0].innerHTML.toLowerCase();
    if (screenName.indexOf(keyword) > -1){
      screens[i].style.display = "";
      screensAmount++;
    } else {
      screens[i].style.display = "none";
    }
  }
  //load amount of pages to gallery title
  document.getElementById("screensamount").innerHTML = screensAmount + " screens";
}
