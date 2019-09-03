@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const document = sketch.fromNative(context.document)
  const UI = require('sketch/ui')
  
  UIDialog.setUp(context);

  let login =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN)
  if(login==undefined || login==null) login = ''  
  let siteRoot =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT)
  if(siteRoot==undefined || siteRoot==null) siteRoot = ''

  let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
  if(commentsURL==undefined) commentsURL = ''
  let serverToolsPath = Settings.settingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH)
  if(serverToolsPath==undefined) serverToolsPath = ''
  let authorName = Settings.settingForKey(SettingKeys.PLUGIN_AUTHOR_NAME)
  if(authorName==undefined) authorName = ''


  const dialog = new UIDialog("Configure Publishing",NSMakeRect(0, 0, 300, 280),"Save","Edit settings which are common for all documents.")


  dialog.addTextInput("login","SFTP Server Login", login,'html@mysite.com:/var/www/html/',350)  
  dialog.addHint("loginHint","SSH key should be uploaded to the site already")

  dialog.addTextInput("siteRoot","Site Root URL", siteRoot,'http://mysite.com',350)  
  dialog.addHint("siteRootHint","Specify to open uploaded HTML in web browser automatically")
  
  dialog.addTextInput("authorName","Author Name", authorName,'John Smith')  
  dialog.addTextInput("serverToolsPath","Relative URL to Server Tools", serverToolsPath,'/_tools/')  
  //dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)

  
  if(dialog.run()){
    //Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.views['comments'].stringValue()+"")
    Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN, dialog.views['login'].stringValue()+"")  
    Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT, dialog.views['siteRoot'].stringValue()+"")  

    Settings.setSettingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH, dialog.views['serverToolsPath'].stringValue()+"")  
    Settings.setSettingForKey(SettingKeys.PLUGIN_AUTHOR_NAME, dialog.views['authorName'].stringValue()+"")  
  }
  dialog.finish()

};

