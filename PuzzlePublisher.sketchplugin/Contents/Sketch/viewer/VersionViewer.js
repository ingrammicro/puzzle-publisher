function getVersionInfoRequest(){
    var resp = this
    if(resp.readyState == resp.DONE) {
        if(resp.status == 200 && resp.responseText != null) {
            const data = JSON.parse(resp.responseText)
            if(undefined!=data['time']){
                viewer.versionViewer._showData(data);
                return true
            }             
        }
        showError("Can't get information about the versions.")
    }
    return false
}


class VersionViewer{
    constructor (){
        this.visible = false
        this.inited = false
    }

    initialize(force=false){
        if(!force && this.inited) return

        // init document common data here
        this._showLoadingMessage()        
        this._askServerTools();

        this.inited = true
    }

    toggle(){
        return this.visible ? this.hide(): this.show()        
    }

    hideSelfOnly(){
        this.visible = false     
        $('#version_viewer').addClass("hidden")        
    }

    hide(){
        viewer.hideSidebar();
    }

    _showScreens(data,showNew){
        var info = "";
        for(const screen of data['screens_changed']){
            if(screen['is_new']!=showNew) continue;
            info += "<div>";
            info += "<img src='"+screen['image_url']+"' border='0'/>";
            info += "</div>";
        }
        return info;
    }

    _showData(data){
        var info = "";

        if(data['screens_total_new']){
            info += "<div>Added screens ("+data['screens_total_new']+")</div>";
            info += this._showScreens(data,true);
        }
        if(data['screens_total_changed']){
            info += "<div>Changed screens ("+data['screens_total_changed']+")</div>";
            info += this._showScreens(data,false);
        }        

        $("#version_viewer_content").html(info)
    }

    _askServerTools(){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = getVersionInfoRequest;
        xhr.open("GET",story.serverToolsPath+"version_info.php?ver="+story.docVersion,true);
        xhr.send(null);
    }

    show(){
        viewer.hideSidebarChild();   

        if(!this.inited) this.initialize()
                 
        $('#version_viewer').removeClass("hidden")        
        viewer.showSidebar(this)
        this.visible = true
    } 

    _showLoadingMessage(){
        $("#version_viewer_content").html("Loading...")
        $('#version_viewer #empty').removeClass("hidden")
    } 
}
