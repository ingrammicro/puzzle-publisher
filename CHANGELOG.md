# Change Log
See discussion on https://github.com/ingrammicro/puzzle-publisher/discussions site


##  Version 16.5.6 (15 Jul 2021)
Fixed Element Inspector

##  Version 16.5.5 (14 Jul 2021)
Hotfix

##  Version 16.5.4 (14 Jul 2021)
- Rolled back icon name support to fix other tokens

##  Version 16.5.3 (10 Jul 2021)
Improving Changes Inspector

##  Version 16.5.2 (07 Jul 2021)
Improving Changes Inspector

##  Version 16.5.1 (29 Jun 2021)
Corrected "Show symbols" toggler behaviour
Show icon names (Part II)

##  Version 16.5.0 (29 Jun 2021)
Use full images in Gallery
Changes Inspector improved
Show icon names

##  Version 16.4.3 (26 Jun 2021)
Fixed internal error related to color variables detection

##  Version 16.4.1 (12 May 2021)
Text search inside Gallery now finds text layers also

##  Version 16.3.1 (30 Apr 2021)
Improved scrolling in Text Search

##  Version 16.3.0 (29 Apr 2021)
Added text search (Cmd+F,Cmd+G)

##  Version 16.2.4 (23 Apr 2021)
Don't export masked layers without Export Preset configured

##  Version 16.2.3 (20 Apr 2021)
Workaround for export crash

##  Version 16.2.2 (16 Apr 2021)
Improved Element Inspector

##  Version 16.2.0 (5 Apr 2021)
Added comment counters to Gallery
Added page labels to Gallery Map view

##  Version 16.1.2 (19 Mar 2021)
Comments Viewer improvements

##  Version 16.1.1 (15 Mar 2021)
Fixed Version Viewer

##  Version 16.1.0 (12 Mar 2021)
Added ability to ignore links to library internal artboards (see Configure Exporting - Artboards)

##  Version 16.0.3 (12 Mar 2021)
Improved comments

##  Version 16.0.2 (05 Mar 2021)
Fixed mockup version up/down browsing

##  Version 16.0.1 (04 Mar 2021)
Improved comments

##  Version 16.0.0 (25 Feb 2021)
Added comments to published mockups

##  Version 15.3.0 (30 Dec 2020)
Element Inspector allows to review overlapped layers by multiply clicking

##  Version 15.2.7 (28 Dec 2020)
Fixed modal poisitioning on large displays

##  Version 15.2.5 (21 Dec 2020)
Escaped "," in image file names to be compatible with Miro
Other fixed for publishing to Miro

##  Version 15.2.4 (06 Dec 2020)
Corrected font size for Linux developers

##  Version 15.2.0 (04 Dec 2020)
Fixed browser page background color
Added option to see font size adjusted for Linux developers

##  Version 15.1.4 (03 Dec 2020)
Fixed Miro issues

##  Version 15.1.3 (25 Nov 2020)
Added support for @XSpacer@ and @YSpacer@ layer name magic keys

##  Version 15.1.3 (25 Nov 2020)
Fixed issues with Gallery Viewer and Embedded Mode

##  Version 15.1.1 (25 Nov 2020)
Redesigned map view by @zubr133
Added page titles to map view

##  Version 15.1.0 (19 Nov 2020)
Impoved map view:
1) Added page interactions
2) Added own URLs to gallery and map views
3) Other improvements

##  Version 15.0.0 (14 Nov 2020)
Added map view to All Screens page
Code refactoring

##  Version 14.11.1 (9 Nov 2020)
Fix: URLs are lowercased again

##  Version 14.11.0 (9 Nov 2020)
Fixed "Open HTML in browser" checkbox behaviour
Suport @Redirect@ for modals too

##  Version 14.10.4 (2 Nov 2020)
Fixed crash

##  Version 14.10.3 (30 Oct 2020)
Fixed support for Shape shadows in Inspector
Fixed "Open in new window" icon behaviour (Embedded mode)
Supported tokens for color variables

##  Version 14.10.2 (28 Sep 2020)
Fixes overlay multishadows

##  Version 14.10.1 (16 Sep 2020)
Fixed navigation menu layout

##  Version 14.10.0 (16 Sep 2020)
Now it's possible to inject any custom JS code into Viewer. See Plugin > Configure Export > JS Code option.
As example - you can hide some navigation menu ites using the following code:
$("#menu #zoom").hide();$("#menu #embed").hide();$("#menu #grid").hide();

"View All Screens" mode now handles "s" key correctly

##  Version 14.9.1 (19 Sep 2020)
Gallery can be opened on document load using &g=1 search param

##  Version 14.8.14 (17 Sep 2020)
Fixed publishing to Miro

##  Version 14.8.13 (17 Sep 2020)
Many improvements in image generation
- Generate full images only if Miro settings configured
- Generate preview images by Sketch, not by external "sips" tool
- Use retina images in Gallery on non-retinal diplays too

##  Version 14.8.12 (10 Sep 2020)
Fixed direct link to modal called from overlay

##  Version 14.8.11 (2 Sep 2020)
Fixed exporting of external "external" artboards
Added success messages to Miro operations

##  Version 14.8.10 (2 Sep 2020)
Fixed login to Miro for passwords with special characters
Improved publishing to Miro

##  Version 14.8.8 (1 Sep 2020)
Group Miro boards by project

##  Version 14.8.7 (31 Aug 2020)
Fixed image paths in Gallery
Improved shared style/symbol information in Element Inspector

##  Version 14.8.6 (27 Aug 2020)
Fixed unstable behaviour of Miro publishing

##  Version 14.8.5 (26 Aug 2020)
Improved publishing to Miro

##  Version 14.8.4 (20 Aug 2020)
"Show All Images" feature now shows full artboard pictures included fixed images
"Publish to Miro" now places artboards correctly to prevent overlaping

##  Version 14.8.3 (19 Aug 2020)
New feature: The plugin can publish mockups on Miro whiteboards

##  Version 14.7.3 (10 Aug 2020)
Link inside a modal to the same modal closes it (similer to overlays)

##  Version 14.7.2 (4 Aug 2020)
Fixed Document Settings modal (height increased to show all fields)

##  Version 14.7.1 (24 July 2020)
Improved External URL dialog

##  Version 14.7.0 (24 July 2020)
Added support for relative URLs

##  Version 14.6.1 (25 June 2020)
Improvement for Element Inspector: click outside of any element unselect current element

##  Version 14.6.0 (19 June 2020)
Added optional Secret Key pair settings to Configure Publishing dialod and server_tools/config.json

##  Version 14.5.0 (19 June 2020)
Element Inspector improved
- build layer tree using valid z-index
- skip text layers with empty (or whitespace only) content
- suppor page navigation (left,right keys)

##  Version 14.4.1 (10 June 2020)
Added support for fixed layers to Element Inspector
Added ability to disable a library sync for document during automation

##  Version 14.4.0 (8 June 2020)
Added support for Image layers to Element Inspector

##  Version 14.3.0 (8 June 2020)
Added margins to Element Inspector

##  Version 14.2.0 (4 June 2020)
New features:
- Element Inspector shows FA icon details

##  Version 14.1.2 (2 June 2020)
Fixed internal error on Sketch startup

##  Version 14.1.1 (2 June 2020)
Improved async mode for sending statistics

##  Version 14.1.0 (1 June 2020)
Added ability to enable debug logging
PP now sends anonymous usage data (using Google Analytics). You can disable it in Configure Plugin.
Workaround two Sketch issues

##  Version 14.0.2 (28 May 2020)
- Improvements and fixes for Element Inspector 

##  Version 14.0.1 (27 May 2020)
- Totally reworked Element Inspector to show all text/shape layer styles
- Updated file protocol between Puzzle Publisher and Puzzle Tokens

##  Version 13.1.2 (29 Apr 2020)
- Fixed error in Sketch 65

##  Version 13.1.1 (22 Mar 2020)
- Improved Version Viewer
- Disable show/hide animations for modal (due to other open issue)

##  Version 13.1.0 (17 Mar 2020)
Synced with PT 8.2.0 changes

##  Version 13.0.5 (14 Mar 2020)
Fixed issues:
- Browser back button doesn't work in PP 13.0.1
- Please fix overlay position when you open overlay from another overlay (GCUX-7530)
- Fix link to close overlay (GCUX-7525)
- Cur trailed "/" in Remote Folder URL 

##  Version 13.0.1 (14 Mar 2020)
Viewer moved from URL format
https://site.com/dd/index.html?embed#home/o/10  
to
https://site.com/dd/index.html?home&o=10&e=1
We need this change because URL with # doesn't work correctly on Apache sites with enabled Azure AD integration.
Attention! The new viewer also supports old URLs.

##  Version 12.7.0 (6 Mar 2020)
New cool design for sidebar (thanks to @zubr133 )
Fixed issue: Element Inspector doesn't show token values for the document which is a library itself

##  Version 12.6.0 (30 Mar 2020)
- Added support for Google Tag Manager codes (GTM* format)

##  Version 12.5.2 (5 Mar 2020)
Fixed case "two links open the same overlay"
Disabled links highlighting for close overlay click event

##  Version 12.5.1 (4 Mar 2020)
Fixed nested overlay behaviour

##  Version 12.5.0 (2 Mar 2020)
Added custom SSH port settings to Configure Publishing dialog

##  Version 12.4.2 (26 Feb 2020)
Respin for 12.4.0

##  Version 12.4.0 (22 Feb 2020)
Added new "Up from top center of hotspot" overlay position

##  Version 12.3.1 (7 Feb 2020)
- Now redirect overlay has its own URL to open 

##  Version 12.3.0 (6 Feb 2020)
- Added ability to export into JPG files (see Configure Export)
- Replaced Show Last Info menu item by Show Change Log
- Accelerated export data for Element Inspector

##  Version 12.2.0 (4 Feb 2020)
- Added Redirect Overlays (see [details](https://spectrum.chat/puzzle-publisher/general/12-2-0-released~77f1e2a4-e3df-4667-b0bb-9067efce29ec))

##  Version 12.1.2 (20 Jan 2020)
- Show a version of published mockups in navigation bar
- Allow browser to handle its own keyboard shortcuts (Cmd+L on mac)

##  Version 12.1.1 (10 Jan 2020)
- Hotfix for 12.1.0 (Element Inspector can not be closed using "m" key)

##  Version 12.1.0 (09 Jan 2020)
- Improved search in Gallery

##  Version 12.0.4 (26 Dec 2019)
- Hide fixed panes under modal shadow

##  Version 12.0.3 (25 Dec 2019)
- Element Inspector shows LESS token values

##  Version 12.0.2 (24 Dec 2019)
- Element Inspector works for overlays too

##  Version 12.0.1 (17 Dec 2019)
- Fix overflow on center layout (by @form-follows-function)

##  Version 12.0.0 (13 Dec 2019)
1) Added artboard transition animations. 
You can select an animation it in Configure Artboard > Transitions.
Overlays use FADE animation by default.
Animation for standalone pages and modals is not stable for now. Will be improved.
2) You can send custom CSS styles to Viewer placing "<SOME LIB>-viewer.css" file together with any enabled library

##  Version 11.6.1 (5 Dec 2019)
- Fixed Element Inspector (Issue #11)
- Fixed overlays in modal
- Removed modal scroller (Issue #12)

##  Version 11.6.0 (3 Dec 2019)
- Added "Replace the previous overlay if called from overlay" option to Artboard Overlay setttings

##  Version 11.5.4 (28 Nov 2019)
- Improved hotspot highlighting key logic to allow users to make screenshots on macOS without highlighted hotposts
- Element Insprector now shows style library names

##  Version 11.5.3 (13 Nov 2019)
- fixed crash on broken symbols

##  Version 11.5.2 (5 Nov 2019)
- test Sketch update system

##  Version 11.5.1 (5 Nov 2019)
- test Sketch update system

##  Version 11.5.0 (5 Nov 2019)
- Improved Configure Artboard dialog (added tabs and images)

##  Version 11.4.1 (30 Oct 2019)
- Several fixed and improvements for Version Viewer

##  Version 11.4.0 (29 Oct 2019)
- Completed image difff viewer (added Shift+Left and Shift+Right to switch diff mode from keyboard)
- Click inside an overlay outside of any hotspots should not close it

##  Version 11.3.0 (28 Oct 2019)
- Render fixed layers as standlanone layer, not as a part of artboard image (to support non-rectangle layers )
- Improved image diffs
- Fixed: Empty Sketch document opening in background when run via Sketchtool (by Arek Talun)
- Improved token inspector

##  Version 11.2.0 (24 Oct 2019)
- Added Search in Gallery
- Show changed screen differences

##  Version 11.0.4 (23 Oct 2019)
- Fixed zoom disabling for wide artboards (PART II) 

##  Version 11.0.3 (22 Oct 2019)
- Fixed zoom disabling for wide artboards
- Fixed *artboard exclusion
- Link in Telegram post opens a page with Version Info mode enabled by default
- Added context option currentPath to provide destination path for prototype

##  Version 11.0.2 (4 Oct 2019)
- Fixed undo of changes which a user did beforee exporting
- Added "Up-to-down" artboard sorting

##  Version 11.0.1 (2 Oct 2019)
- Added additional checks to skip wrong page objects
- Fixed JSON generator

##  Version 11.0.0 (2 Oct 2019)
- Totally changed a way to apply symbol overrides in order to make it compatible with Smart Layouts

##  Version 10.3.3 (26 Sep 2019)
- Fixed rendering of artboard with fixed layers (on some installations Sketch was too lazy) (part II)

##  Version 10.3.2 (24 Sep 2019)
- Fixed "Hotspot top center" and "Hotspot top right corner" overlay aligmnent modes
- Fixed rendering of artboard with fixed layers (on some installations Sketch was too lazy)

##  Version 10.3.1 (23 Sep 2019)
- Hotspot in fixed panel aligned to bottom opens overlay also aligned to bottom

##  Version 10.3.0 (16 Sep 2019)
- Redesigned Gallery

##  Version 10.2.2 (14 Sep 2019)
- Add additional check for valid libraries
- Disabled unstable image compression

##  Version 10.2.1 (13 Sep 2019)
- Icon updated

##  Version 10.2.0 (06 Sep 2019)
- Added Version Viewer (requires [server tools|https://github.com/ingrammicro/puzzle-publisher/tree/master/server_tools]) installed on your WWW server)

##  Version 10.1.0 (03 Sep 2019)
- Added Announce Changes feature for mockups published on SFTP (requires [server tools|https://github.com/ingrammicro/puzzle-publisher/tree/master/server_tools]) installed on your WWW server.

##  Version 10.0.2 (02 Sep 2019)
- Fixed "Export selected page artboards" feature

##  Version 10.0.1 (28 Aug 2019)
- Fixed mouse-over artboards for "page scrolled down" case
- Added Up/Down Version feature for mockups published on SFTP (requires [server support](https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/server_tools/folder_info.php))

##  Version 10.0.0 (20 Aug 2019)
- Moved from https://github.com/MaxBazarov/exporter/
