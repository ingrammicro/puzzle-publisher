/*
The MIT License (MIT)

Copyright (c) 2019 Miro Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var api = new Api();
var siteURL = "https://miro.com/";
var path = siteURL + "api/v1/";
var appURL = siteURL + "app/";
var boardURL = appURL + "board/";
var ssoURL = siteURL + "sso/login/?sketch=1";
var googleOAuthURL = "https://accounts.google.com/Logout?continue=https://accounts.google.com/o/oauth2/auth?access_type%3Doffline%26response_type%3Dcode%26client_id%3D1062019541050-8mvc17gv9c3ces694hq5k1h6uqio1cfn.apps.googleusercontent.com%26scope%3Dprofile%2520email%26include_granted_scopes%3Dtrue%26redirect_uri%3Dhttps%3A%2F%2Fmiro.com%2Fsocial%2Fgoogle%2F";
var exportPath = NSTemporaryDirectory() + "sketch-rtb-export/";

function dealWithErrors(context, message) {
    var alert = [[NSAlert alloc] init];
    [alert setMessageText: "Connection error"];

    if (message) {
        [alert setInformativeText: message];
    } else {
        [alert setInformativeText: "Please check your internet connection and retry."];
    }

    [alert runModal];
}

function removeForbiddenCharacters(string) {
    return string.replace(/[\\/,]/g, "");
}

function encodeHtmlSpecialCharacters(string) {
    return string.replace(/&/gi, '&amp;')
        .replace(/</gi, '&lt;')
        .replace(/>/gi, '&gt;')
        .split('"')
        .join('&quot;')
}

function Api() {
    Api.prototype.UploadEnum = {
        SUCCESS: 1,
        NO_ARTBOARDS: 2,
        NO_ARTBOARDS_SELECTED: 3,
        UPLOAD_FAILED: 4
    }

    Api.prototype.setSetting = function (name, value) {
        [[NSUserDefaults standardUserDefaults] setObject: value forKey: name];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }

    Api.prototype.getSetting = function (name) {
        var value = [[NSUserDefaults standardUserDefaults] objectForKey: name];

        if (value) {
            return value;
        } else {
            return false;
        }
    }

    Api.prototype.setFromRetina = function (fromRetina) {
        this.setSetting("from_retina", fromRetina);
    }

    Api.prototype.getFromRetina = function () {
        return this.getSetting("from_retina");
    }

    Api.prototype.setToken = function (token) {
        this.setSetting("rtb_token", token);
    }

    Api.prototype.getToken = function () {
        return this.getSetting("rtb_token");
    }

    Api.prototype.setLastBoardId = function (boardId) {
        this.setSetting("last_board_id", boardId);
    }

    Api.prototype.getLastBoardId = function () {
        return this.getSetting("last_board_id");
    }

    Api.prototype.setOpenBoard = function (openBoard) {
        this.setSetting("open_board", openBoard);
    }

    Api.prototype.getOpenBoard = function () {
        return this.getSetting("open_board");
    }

    Api.prototype.getBoards = function (context) {
        var accountsResult = api.accountsRequest(context);

        if (accountsResult) {
            accountsResult = accountsResult.filter(function (item) {
                return !item.expired;
            });
            var boards = [];

            for (var i = 0; i < accountsResult.length; i++) {
                var accountBoards = api.boardsRequest(context, accountsResult[i].id);

                if (accountBoards) {
                    accountBoards = accountBoards.data;

                    for (var j = 0; j < accountBoards.length; j++) {
                        if (accountBoards[j].currentUserPermission.role == "EDITOR"
                            || accountBoards[j].currentUserPermission.role == "OWNER") {
                            var title = accountBoards[j]["title"]
                            var board = {
                                boardId: accountBoards[j]["id"],
                                title: title,
                                lastOpenedByMeDate: accountBoards[j]["lastOpenedByMeDate"]
                            };
                            if (accountBoards[j]['project'] != null) {
                                board['project'] = accountBoards[j]['project']["title"]
                            }

                            // fix name duplicates
                            let dupIndex = 0
                            while (boards.find(
                                function (el) {
                                    return el['title'] == (title + (dupIndex == 0 ? "" : (" " + dupIndex)))
                                }
                            )) {
                                dupIndex++
                            }
                            if (dupIndex > 0) {
                                board["title"] = board["title"] + " " + dupIndex
                            }
                            //

                            boards.push(board);
                        }
                    }
                }
            }

            boards.sort(function (a, b) {
                if (a["title"] > b["title"]) {
                    return 1;
                }
                if (a["title"] < b["title"]) {
                    return -1;
                }
            })
            return boards;
        }
        return false;
    }

    Api.prototype.authRequest = function (context, data) {
        var result = this.request(context, "auth", "POST", data);
        return result;
    }

    Api.prototype.authCheckRequest = function (context, errorHandlingInfo) {
        var token = this.getToken();
        var result = false;

        if (token) {
            var url = "auth/check";
            var data = { token: token };
            result = this.request(context, url, "POST", data, errorHandlingInfo);
        }

        return result;
    }

    Api.prototype.logoutRequest = function (context) {
        var token = this.getToken();
        var result = false;

        if (token) {
            var url = "auth/logout";
            var data = { token: token };
            result = this.request(context, url, "POST", data);
        }

        return result;
    }

    Api.prototype.SSOAuth = function (context, email) {
        var result = false;
        var url = "sso/saml/info?email=" + email;

        result = this.request(context, url, "GET");

        return result;
    }

    Api.prototype.accountsRequest = function (context) {
        var token = this.getToken();
        var result = null;

        if (token) {
            var url = "accounts/?fields=id,title,currentUserPermission,expired";
            result = this.request(context, url, "GET", null);
        }

        return result;
    }

    Api.prototype.boardsRequest = function (context, accountId) {
        var token = this.getToken();
        var result = null;

        if (token) {
            var url = "boards/?sort=LAST_OPENED&attachment=" + accountId + "&fields=title,project,id,currentUserPermission{role},lastOpenedByMeDate&limit=1000";
            result = this.request(context, url, "GET", null);
        }

        return result;
    }

    Api.prototype.request = function (context, url, method, data, errorHandlingInfo) {
        var fullURL = path + url;
        var stringURL = [NSString stringWithFormat: fullURL];
        var webStringURL = [stringURL stringByAddingPercentEscapesUsingEncoding: NSUTF8StringEncoding].replace(/\+/g, '%2B');
        var request = [NSMutableURLRequest requestWithURL: [NSURL URLWithString: webStringURL]];

        [request setHTTPMethod: method];
        [request setValue: "application/json" forHTTPHeaderField: "Accept"];
        [request setValue: "application/json" forHTTPHeaderField: "Content-Type"];

        var token = this.getToken();
        var auth = "hash " + token;
        var authHeader = "Authorization";

        [request setValue: auth forHTTPHeaderField: authHeader];

        if (data) {
            var postData = [NSJSONSerialization dataWithJSONObject: data options: NSUTF8StringEncoding error: nil];
            [request setHTTPBody: postData];
        }

        var response = [[MOPointer alloc] init];
        var dataResp = [NSURLConnection sendSynchronousRequest: request returningResponse: response error: nil];

        if (dataResp != nil) {
            var responseText = [[NSString alloc] initWithData: dataResp encoding: NSUTF8StringEncoding];

            try {
                var json = JSON.parse(responseText);

                if (json.error) {
                    logErr(JSON.stringify(json.error));
                }

                return json;
            } catch (e) {
                var message = "Unable to parse response data for path: " + url;

                dealWithErrors(context, message);
            }
        } else {
            logErr('dataResp == null');

            dealWithErrors(context);
        }

        return false;
    }

    Api.prototype.uploadArtboardsToRTB = function (context, boardId, exportAll) {
        var fullURL = path + "boards/" + boardId + "/integrations/imageplugin";
        var stringURL = [NSString stringWithFormat: fullURL];
        var webStringURL = [stringURL stringByAddingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
        var token = this.getToken();
        var auth = "hash " + token;
        var scale = this.getFromRetina() == 1 ? 2 : 1;
        var exportInfoList = this.artboardsToPNG(context, exportAll, scale);

        if (exportInfoList.length == 0) {
            var document = context.document;
            var page = [document currentPage];
            var artboards = [page artboards];

            if (artboards.length == 0) {
                return this.UploadEnum.NO_ARTBOARDS;
            } else {
                return this.UploadEnum.NO_ARTBOARDS_SELECTED;
            }
        }

        var task = [[NSTask alloc] init];
        [task setLaunchPath: "/usr/bin/curl"];

        var makeDataString = function (transformationData, sizeData, identifier) {
            if (!transformationData) {
                transformationData = '';
            }

            var idField = identifier ? '"id": "' + identifier + '",' : '';

            return '{' + idField + '"type": "ImageWidget","json": "{\\"transformationData\\": { ' + transformationData + '}}"}';
        };

        var dataString = '',
            dataArray = [];
        var largeX = 0;
        var lastPageId = null;
        var marginX = 0;
        var pageMarginX = 0
        var pageMarginY = 0
        var rightX = 0
        const sketch = require('sketch');

        for (var i = 0; i < exportInfoList.length; i++) {
            var artboard = exportInfoList[i].artboard;
            var resourceId = context.command.valueForKey_onLayer_forPluginIdentifier(boardId, artboard, "rtb_sync");
            var originalId = context.command.valueForKey_onLayer_forPluginIdentifier("originalId", artboard, "rtb_sync");
            var objectId = [artboard objectID];
            var absoluteInfluenceRect = [artboard absoluteInfluenceRect];
            var pageId = artboard.parentGroup().objectID()

            if (pageId != lastPageId) {
                marginX = largeX + 200
                lastPageId = pageId
                pageMarginX = 0 - absoluteInfluenceRect.origin.x
                pageMarginY = 0 - absoluteInfluenceRect.origin.y
            }

            var xPos = absoluteInfluenceRect.origin.x + marginX + pageMarginX;
            var yPos = absoluteInfluenceRect.origin.y + pageMarginY;
            var width = absoluteInfluenceRect.size.width;
            var height = absoluteInfluenceRect.size.height;

            if ((xPos - largeX) > 300) {
                log("name: " + artboard.name())
                log("old xPos: " + xPos)
                log("largeX: " + largeX)
                log("old MarginX: " + marginX)
                marginX -= xPos - largeX - 300
                log("new MarginX: " + marginX)
                xPos = absoluteInfluenceRect.origin.x + marginX + pageMarginX;
                log("new xPos: " + xPos)
            }

            var centralXPos = width / 2 + xPos;
            var centralYPos = height / 2 + yPos;
            var transformationData = '\\"positionData\\":{\\"x\\": ' + centralXPos + ', \\"y\\":' + centralYPos + ' }';

            rightX = xPos + width
            if (rightX > largeX) largeX = rightX  // save new right edge

            if (scale == 2) {
                transformationData += ', \\"scaleData\\":{\\"scale\\": ' + 0.5 + ' }';
            }

            var sizeData = '\\"width\\": ' + width + ', \\"height\\":' + height;

            if (resourceId != nil && (originalId == nil || [objectId isEqualToString: originalId])) {
                dataArray.push(makeDataString(transformationData, sizeData, resourceId));
            } else {
                dataArray.push(makeDataString(transformationData, sizeData));
            }

            if (originalId != objectId) {
                if (resourceId != nil) {
                    context.command.setValue_forKey_onLayer_forPluginIdentifier(nil, boardId, artboard, "rtb_sync");
                }

                context.command.setValue_forKey_onLayer_forPluginIdentifier(objectId, "originalId", artboard, "rtb_sync");
            }
        }

        dataString = dataArray.join(', ');

        var graphicsPluginRequest = 'GraphicsPluginRequest={"data":[' + dataString + ']};type=application/json ';
        var args = [[NSMutableArray alloc] init];

        args.addObject("-v");
        args.addObject("POST");
        args.addObject("--header");
        args.addObject("Content-Type: multipart/form-data");
        args.addObject("--header");
        args.addObject("Authorization: " + auth);
        args.addObject("--header");
        args.addObject("Accept: application/json");
        args.addObject("--header");
        args.addObject("X-Requested-With: XMLHttpRequest");
        args.addObject("--header");
        args.addObject("Connection: keep-alive");
        args.addObject("--compressed");
        args.addObject("-F");
        args.addObject(graphicsPluginRequest);

        for (var i = 0; i < exportInfoList.length; i++) {
            args.addObject("-F");
            args.addObject("ArtboardName1=@" + exportInfoList[i]["path"]);
        }

        args.addObject(fullURL);

        [task setArguments: args];

        var outputPipe = [NSPipe pipe];

        [task setStandardOutput: outputPipe];
        [task launch];

        var outputData = [[outputPipe fileHandleForReading] readDataToEndOfFile];

        this.clearExportFolder();

        var classNameOfOuput = NSStringFromClass([outputData class]);

        if (classNameOfOuput != "_NSZeroData") {
            var res = [NSJSONSerialization JSONObjectWithData: outputData options: NSJSONReadingMutableLeaves error: nil]
            if (res != null) {
                if (res.error != nil) {
                    logErr(res.error)
                } else {
                    for (var i = 0; i < res.widgets.length; i++) {
                        var artboard = exportInfoList[i];
                        context.command.setValue_forKey_onLayer_forPluginIdentifier(res.widgets[i]["resourceId"], boardId, artboard.artboard, "rtb_sync");
                    }
                    return this.UploadEnum.SUCCESS;
                }
            } else {
                logErr('res == null')
            }
        } else {
            logErr('classNameOfOuput == _NSZeroData')
        }

        return this.UploadEnum.UPLOAD_FAILED;
    }

    Api.prototype.artboardsToPNG = function (context, exportAll, scale) {
        var document = context.document;
        var page = [document currentPage];
        var artboards = [page artboards];
        var exportInfoList = [];

        for (var i = 0; i < artboards.length; i++) {
            if (exportAll == 1 || (artboards[i].isSelected() && exportAll == 0)) {
                var msartboard = artboards[i];
                var artboardID = [msartboard objectID];
                var name = removeForbiddenCharacters([msartboard name]);
                var path = exportPath + "/" + artboardID + "/" + name + ".png";
                var format = [[MSExportFormat alloc] init];

                format.fileFormat = "png";
                format.scale = scale;

                var exportRequest = [[MSExportRequest exportRequestsFromExportableLayer: msartboard exportFormats: [format] useIDForName: true] firstObject];
                [document saveArtboardOrSlice: exportRequest toFile: path];

                var exportInfo = { "artboardID": artboardID, "artboard": msartboard, "path": path };
                exportInfoList.push(exportInfo);
            }
        }

        return exportInfoList;
    }

    Api.prototype.clearExportFolder = function () {
        var manager = [NSFileManager defaultManager];
        [manager removeItemAtPath: exportPath error: nil];
    }
}
