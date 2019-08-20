@import "constants.js";
const Rectangle = require('sketch/dom').Rectangle

Rectangle.prototype.round = function () {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.height = Math.round(this.height)
    this.width = Math.round(this.width)
}

Rectangle.prototype.insideRectangle = function (r) {
    return this.x >= r.x && this.y >= r.y
        && ((this.x + this.width) <= (r.x + r.width))
        && ((this.y + this.height) <= (r.y + r.height))
}

Rectangle.prototype.copy = function () {
    return new Rectangle(this.x, this.y, this.width, this.height)
}
Rectangle.prototype.copyToRect = function () {
    return NSMakeRect(this.x, this.y, this.width, this.height)
}

class Utils {

    static askPath(currentPath = null, buttonName = "Select") {
        let panel = NSOpenPanel.openPanel()
        panel.setTitle("Choose a location...")
        panel.setPrompt(buttonName)
        panel.setCanChooseDirectories(true)
        panel.setCanChooseFiles(false)
        panel.setAllowsMultipleSelection(false)
        panel.setShowsHiddenFiles(false)
        panel.setExtensionHidden(false)
        if (currentPath != null && currentPath != undefined) {
            let url = [NSURL fileURLWithPath: currentPath]
            panel.setDirectoryURL(url)
        }
        const buttonPressed = panel.runModal()
        const newURL = panel.URL()
        panel.close()
        panel = null
        if (buttonPressed == NSFileHandlingPanelOKButton) {
            return newURL.path() + ''
        }
        return null
    }

    static writeToFile(str, filePath) {
        const objcStr = NSString.stringWithFormat("%@", str);
        return objcStr.writeToFile_atomically_encoding_error(filePath, true, NSUTF8StringEncoding, null);
    }

    static readFile(path) {
        const fileManager = NSFileManager.defaultManager();
        if (!fileManager.fileExistsAtPath(path)) {
            return undefined
        }

        return NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, null);
    }


    static cutLastPathFolder(path) {
        return path.substring(0, path.lastIndexOf("/"))
    }


    static deleteFile(filePath) {
        const fileManager = NSFileManager.defaultManager();

        let error = MOPointer.alloc().init();
        if (fileManager.fileExistsAtPath(filePath)) {
            if (!fileManager.removeItemAtPath_error(filePath, error)) {
                log(error.value().localizedDescription());
            }
        }
    }

    static cloneDict(dict) {
        return Object.assign({}, dict);
    }


    static escapeSpaces(path) {
        const regex = / /gi;
        return path.replace(regex, "\\ ")
    }

    static copyRect(rect) {
        return NSMakeRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height)
    }


    // rect: GRect instnct
    static copyRectToRectangle(rect) {
        return new Rectangle(rect.x(), rect.y(), rect.width(), rect.height())
    }

    // rect: Rectangle instance
    static transformRect(rect, cw, ch) {
        rect.x = rect.x * cw
        rect.y = rect.y * ch
        rect.width = rect.width * cw
        rect.width = rect.height * ch
    }

    static quoteString(str) {
        return str.split('"').join('\\"')
    }

    static toFilename(name, dasherize = true) {
        if (dasherize == null) {
            dasherize = true;
        }
        const dividerCharacter = dasherize ? "-" : "_"
        return name.replace(/[/]/g, "").replace(/[\s_-]+/g, dividerCharacter).toLowerCase()
    }


    static getArtboardGroups(artboards, context) {
        const artboardGroups = [];

        artboards.forEach(function (artboard) {
            // skip marked by '*'
            if (artboard.name().indexOf("*") == 0) {
                return
            }
            artboardGroups.push([{ artboard: artboard, baseName: artboard.name() }]);
        });
        return artboardGroups;
    }



    static isSymbolsPage(page) {
        return page.artboards()[0].isKindOfClass(MSSymbolMaster);
    }

    static removeFilesWithExtension(path, extension) {
        const error = MOPointer.alloc().init();
        const fileManager = NSFileManager.defaultManager();
        const files = fileManager.contentsOfDirectoryAtPath_error(path, null);
        files.forEach(function (file) {
            if (file.pathExtension() == extension) {
                if (!fileManager.removeItemAtPath_error(path + "/" + file, error)) {
                    log(error.value().localizedDescription());
                }
            }
        });
    }


    static runCommand(command, args) {
        var task = NSTask.alloc().init();

        var pipe = NSPipe.alloc().init()
        task.setStandardOutput_(pipe);
        task.setStandardError_(pipe);
        task.setLaunchPath(command);
        task.arguments = args;
        task.launch();
        task.waitUntilExit();


        var fileHandle = pipe.fileHandleForReading()
        var data = [fileHandle readDataToEndOfFile];
        var outputString = [[NSString alloc] initWithData: data encoding: NSUTF8StringEncoding];

        return {
            result: (task.terminationStatus() == 0),
            output: outputString
        }
    }
}

