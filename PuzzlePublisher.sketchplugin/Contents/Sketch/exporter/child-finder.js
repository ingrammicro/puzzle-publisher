@import("constants.js")
@import("lib/utils.js")


class ChildFinder {
    constructor() {
    }

    // find overrided layer by customPropery path
    findChildInPath(prefix, l, path, index) {
        let foundLayer = undefined
        let seekId = path[index]
        const lastIndex = path.length - 1

        // if start from current layer itself?
        if (seekId == l.objectID) {
            seekId = path[++index]
        }

        for (var layer of l.childs) {
            //exporter.logMsg(prefix + "scan layer.id=" + layer.objectID + "  seekID=" + seekId)
            if (layer.objectID == seekId || layer.originalID == seekId) {
                //exporter.logMsg(prefix + "found!")
                if (index == lastIndex) {
                    foundLayer = layer
                    //exporter.logMsg(prefix + "found last")
                    return foundLayer
                }
                foundLayer = this.findChildInPath(prefix + " ", layer, path, index + 1)
                return foundLayer
            }
        }

        // failed to found. time to use deep nested search
        for (var layer of l.childs) {
            foundLayer = this.findChildInPath(prefix + " ", layer, path, index)
            if (foundLayer) return foundLayer
        }

        return undefined
    }

    // find child layer by ID
    findChildByID(l, id, recursive=true) {
        for (var layer of l.childs) {
            if (layer.objectID == id) {
                return layer
            }
            if (recursive && layer.childs.length > 0) {
                const foundLayer = this.findChildByID(layer, id, true)
                if (foundLayer != undefined) return foundLayer
            }
        }

        return undefined
    }

}