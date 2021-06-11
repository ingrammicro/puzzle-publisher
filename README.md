# Puzzle Publisher

A Sketch plugin that exports Sketch artboards into clickable HTML file. 

### Join [GitHub Comments](https://github.com/ingrammicro/puzzle-publisher/discussions) for live talk ###

Features:
- Single HTML file with links highlighting
- Show artboard as an overlay over a previous artboard / [Pict 1](https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/FixedLayers/Overlay1.png), [Pict 2](https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/FixedLayers/Overlay2.png), [Pict 3](https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/FixedLayers/Overlay3.png) / [Example](https://github.com/ingrammicro/puzzle-publisher/tree/master/examples/FixedLayers)
- Show artboard as a modal over a previous artboard  / [Picture](https://github.com/ingrammicro/puzzle-publisher/raw/master/examples/Pictures/Link-ModalArtboard.png), [Example](https://github.com/ingrammicro/puzzle-publisher/raw/master/examples/Link-ModalArtboard.sketch)
- Support for layers with fixed position (left,top and float panels) / [Sketch example](https://github.com/ingrammicro/puzzle-publisher/tree/master/examples/FixedLayers) / [HTML Demo](https://ingrammicro.github.io/puzzle-publisher/FixedLayers)
- Support for Sketch-native links (including Back links, cross-page links, links inside Symbols and overrided hotspot links)
- Support for external links / [Hint](https://github.com/ingrammicro/puzzle-publisher/blob/master/Hints.md#hint2)
- Skips pages and artboards with * prefix 
- Ability to insert Google counter
- Ability to hide navigation controls and hotspot highlighting
- Automatic compression of images
- Browser favicon customization [Sketch example](https://github.com/ingrammicro/puzzle-publisher/tree/master/examples/Favicon) / [HTML Demo](https://ingrammicro.github.io/puzzle-publisher/Favicon)

Viewer features:
- Gallery / [Picture](https://github.com/ingrammicro/puzzle-publisher/raw/master/examples/Pictures/Gallery.png)
- Async pre-loading of all page images
- Auto-scale of large pages to fit into small browser window
- Ability to get <iframe> code to embed you prototypes into external web pages (with special UI) or get lightweight code with just <a href...><img...></a/>
- Page layout viewer (if it was enabled for a page)
- [NEW] Element Inspector to see symbols, styles and design tokens(requires integration with Design System plugin) ([Picture](https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Link-ModalArtboard/Screenshot.png))

Publisher features:
- Increasing of version counter and injecting it into HTML
- Publishing to external site by SFTP
- Publishing to Miro whiteboards
- Announce new version changes in Telegram channel

Run from command line:
- Export HTML from command line / [Hint](https://github.com/ingrammicro/puzzle-publisher/blob/master/Hints.md#hint4)

[Change Log](https://github.com/ingrammicro/puzzle-publisher/blob/master/CHANGELOG.md)

Please send your feedback and requests to max@bazarov.ru

## Screenshots
Commands:

<img width="20%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Menu.png"/><img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Export-Dialog.png"/><img width="40%" src="https://github.com/ingrammicro/puzzle-publisher/blob/master/examples/Pictures/Publish-Dialog.png?raw=true"/>

Settings: 

<img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Layer-Dialog.png"/><img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Artboard-Dialog1.png"/><img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Artboard-Dialog2.png"/><img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Document-Dialog.png"/><img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Pictures/Plugin-Dialog.png"/>

Viewer - Show symbols (and design tokens):

<img width="40%" src="https://raw.githubusercontent.com/ingrammicro/puzzle-publisher/master/examples/Show Symbols/screenshot.png"/>

## Installation

To install, [download the zip file](https://github.com/ingrammicro/puzzle-publisher/raw/master/PuzzlePublisher.sketchplugin.zip) and double-click on `PuzzlePublisher.sketchplugin`. The commands will show up under `Plugins > Puzzle Publisher`. 

## Usage

You can use Sketch-native links or add links to external sites. When you're finished adding these you can generate a HTML website of the all document pages by selecting `Export to HTML`. The generated files can then be uploaded to a server so you can show it to your clients. 

### Retina Images
 
By default it will show 2x images for high pixel density screens. To turn this off uncheck `Export retina images` in Settings and re-export the page.

### Special magic string in layer names
- @MainBackground@: a shape layer background color will be used as a default color for browser pages
- @SiteIcon@: an image layer will be rendered as site icon for mockups
- @Redirect@: a link from a marked hostpot will be used to show a page under an overlay ([example](https://github.com/ingrammicro/puzzle-publisher/tree/master/tests/12.2.0))
