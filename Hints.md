# Puzzle Publisher plugin Hints

## [Hint 1](#hint1): Use post-processing to inject your own information in generated HTML

The main index.html contains a special placeholder **\<!\-\-VERSION\-\-\>**.

	<ul id="nav-title">
    	<li><div class="nav-title-label">Screen title <!--VERSION--></div><div class="title">Title</div></li>
    </ul>

You can replace it with some your own information, for example — you can show prototype version here.
The following command uses "sed" tool.

	sed -i '' "s/<!--VERSION-->/(v123)/g" "index.html"
	
In the same way you can add inject your own CSS file by locating to <!--HEAD_INJECT--> code.


## [Hint 2](#hint2): How to set external link for overrided symbol hotspot 

Sometimes you need to set an external URL for hotspot target. You can't use "Set External Link for layer" command in this case because it's not possible to select some of symbol childs. 

But you can follow the another way. 
- Create small empty artboard
- Use "Set External Link for layer" command for this artboard
- Select this artobard as a overrided target for your hotsport 
- Run Export to HTML to see a result

[Illustration](https://github.com/ingrammicro/puzzle-publisher/raw/master/tests/Pictures/Link-ExternalArtboard.png), [Example file](https://github.com/ingrammicro/puzzle-publisher/raw/master/tests/Link-ExternalArtboard.sketch)


## [Hint 3](#hint3): How to set a start/home page for a prototype
Select "Prototyping > Use Artboard as Start Point" menu item to mark/unmark the selected artboard as home.

## [Hint 4](#hint4): How to export Sketch document to HTML using command line
Run the following command (don't forget to inject a path to your file into  a "--context" JSON file)

	/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool --without-activating=YES --new-instance=No run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/PuzzlePublisher.sketchplugin "cmdRun"  --context='{"file":"/Users/baza/GitHub/puzzle-publisher/tests/Links2.sketch","commands":"sync,export,publish,save"}'

## [Hint 5](#hint5): How to see the plugin log
	tail -f ~/Library/Logs/com.bohemiancoding.sketch3/Plugin\ Log.log


## [Hint 6](#hint6): How to change a browser page background for all documents
 Add "@MainBackground@" magic string to any libary symbol layer name to use its background color as a default color for browser pages

## [Hint 7](#hint7): How to treat symbols as artboards 
See discission [here](https://github.com/ingrammicro/puzzle-publisher/discussions/34)
