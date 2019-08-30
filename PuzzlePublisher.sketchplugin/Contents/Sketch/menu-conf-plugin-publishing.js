@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const document = sketch.fromNative(context.document)
  const UI = require('sketch/ui')
  
  UIDialog.setUp(context);


  let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
  if(commentsURL==undefined) commentsURL = ''
  let serverToolsPath = Settings.settingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH)
  if(serverToolsPath==undefined) serverToolsPath = ''
  let authorName = Settings.settingForKey(SettingKeys.PLUGIN_AUTHOR_NAME)
  if(authorName==undefined) authorName = ''


  const dialog = new UIDialog("Configure Publishing",NSMakeRect(0, 0, 300, 200),"Save","Edit settings which are common for all documents.")

  dialog.addTextInput("authorName","Author Name", authorName,'John Smith')  
  dialog.addTextInput("serverToolsPath","Relative URL to Server Tools", serverToolsPath,'/_tools/')  
  //dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)

  
  if(dialog.run()){
    //Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.views['comments'].stringValue()+"")
    Settings.setSettingForKey(SettingKeys.PLUGIN_SERVERTOOLS_PATH, dialog.views['serverToolsPath'].stringValue()+"")  
    Settings.setSettingForKey(SettingKeys.PLUGIN_AUTHOR_NAME, dialog.views['authorName'].stringValue()+"")  
  }
  dialog.finish()

};

