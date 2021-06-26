@import "constants.js";
var DEBUG = Constants.LOGGING || require('sketch/settings').settingForKey(SettingKeys.PLUGIN_LOGDEBUG_ENABLED)


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


    static getDocSetting(doc, key, defaultValue = '') {
        const Settings = require('sketch/settings')
        let value = Settings.documentSettingForKey(doc, key)
        if (undefined == value || null == value) value = defaultValue
        return value
    }

    static getPluginSetting(key, defaultValue = '') {
        const Settings = require('sketch/settings')
        let value = Settings.settingForKey(key)
        if (undefined == value || null == value) value = defaultValue
        return value
    }


    static upgradeArtboardOverlayPosition(oldValue) {
        const newValues = {
            pinTo: 0,
            hotspotTo: 0,
            pageTo: 0
        }
        if (undefined == oldValue) return newValues
        //
        switch (oldValue) {
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_LEFT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_CENTER:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_RIGHT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_CENTER:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT_ALIGN_RIGHT:
                newValues.pinTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT;
                break
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_LEFT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_CENTER:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_LEFT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_CENTER:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_RIGHT:
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_CENTER:
                newValues.pinTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE;
                break
            ///
        }
        switch (oldValue) {
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_LEFT:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_LEFT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_CENTER:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_CENTER; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_RIGHT:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_UNDER_RIGHT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_LEFT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_CENTER:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_CENTER; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_TOP_RIGHT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT_ALIGN_RIGHT:
                newValues.hotspotTo = Constants.ARTBOARD_OVERLAY_PIN_HOTSPOT_BOTTOM_RIGHT; break;
            //
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_LEFT:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_LEFT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_CENTER:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_CENTER; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_TOP_RIGHT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_LEFT:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_LEFT; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_CENTER:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_CENTER; break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_BOTTOM_RIGHT:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_BOTTOM_RIGHT;
                break;
            case Constants.OLD_ARTBOARD_OVERLAY_ALIGN_CENTER:
                newValues.pageTo = Constants.ARTBOARD_OVERLAY_PIN_PAGE_CENTER;
                break;

        }
        //
        return newValues
    }



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
        return name.replace(/[\\/,&:]/g, "_").replace(/[\s_-]+/g, dividerCharacter).toLowerCase()
    }



    static isSymbolsPage(page) {
        return page.artboards()[0].isKindOfClass(MSSymbolMaster);
    }

    static removeFilesWithExtension(path, extension, extension2 = null) {
        const error = MOPointer.alloc().init();
        const fileManager = NSFileManager.defaultManager();
        const files = fileManager.contentsOfDirectoryAtPath_error(path, null);
        files.forEach(function (file) {
            if (file.pathExtension() == extension || (extension2 != null && file.pathExtension() == extension2)) {
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

    static actionWithType(nDoc, type) {
        var controller = nDoc.actionsController();

        if (controller.actionWithName) {
            return controller.actionWithName(type);
        } else if (controller.actionWithID) {
            return controller.actionWithID(type);
        } else {
            return controller.actionForID(type);
        }
    }

    static getMiroBoardsGroupedByProject(context) {
        //  Get token
        var token = api.getToken();
        if (!token) return null
        log("publishToMiro: got token")

        // Get request
        var response = api.authCheckRequest(this.context);
        if (response && response.success != 1) return null

        log("publishToMiro: established connect")

        const boards = api.getBoards()
        let projects = boards.map(el => el["project"]).filter(function (x, i, a) {
            return x != undefined && a.indexOf(x) === i;
        });
        projects.sort()
        let groupedBoards = []
        let indexIdsMap = []
        projects.forEach(function (project) {
            groupedBoards.push("--- " + project + " ----")
            indexIdsMap.push("")
            boards.filter(el => el["project"] == project).forEach(function (el) {
                groupedBoards.push(el['title'])
                indexIdsMap.push(el['boardId'])
            })
        })
        const boardsWithouProject = boards.filter(el => !("project" in el))
        if (boardsWithouProject.length) {
            if (projects.length) {
                groupedBoards.push("--- " + "Out of projects" + " ----")
                indexIdsMap.push("")
            }
            boardsWithouProject.forEach(function (el) {
                groupedBoards.push(el['title'])
                indexIdsMap.push(el['boardId'])
            })
        }

        return {
            indexIdsMap: indexIdsMap,
            boards: groupedBoards
        }
    }

    static testMiro(context, email, password, board) {
        const UI = require('sketch/ui')

        // Drop old token
        if (api.getToken()) {
            api.logoutRequest(context);
            api.setToken(nil);
        }

        var keys = [NSMutableArray array];
        [keys addObject: 'email'];
        [keys addObject: 'password'];

        var values = [NSMutableArray array];
        [values addObject: email];
        [values addObject: encodeHtmlSpecialCharacters(password)];

        var data = [[NSDictionary alloc] initWithObjects: values forKeys: keys]

        var response = api.authRequest(context, data);
        if (response) {
            if (response.error) {
                var messages = getMessagesByError(response.error);

                if (messages.alert) {
                    UI.alert("Can't connect to Miro", messages.alert)
                } else if (messages.label) {
                    UI.alert("Can't connect to Miro", messages.label)
                }
            } else {
                // Set new token
                var token = response.token;
                api.setToken(token);
                api.setFromRetina(true)
                return true
            }
        } else {
            UI.alert("Can't connect to Miro", "No response")
        }
        return false
    }
}

