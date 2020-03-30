# Change Log
See discussion on https://spectrum.chat/puzzle-publisher site

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
