const sketch = require('sketch')

var onDocumentChanged = function (context) {
    const document = require('sketch').getSelectedDocument()

    var changes = context.actionContext
    for (var i = 0; i < changes.length; i++) {
        var change = changes[i];
        var path = change.fullPath();
        var type = change.type();

        switch (type) {
            case 1: // Property change
                log(`Property changed at ${path}`);
                handleGroupChanges(sketch.fromNative(change.object()).parent)
                break;
            case 2: // Deletion
                // Objects that got moved in the tree are both deleted from the tree
                // and re-added.
                if (change.isMove()) break;

                log(`Object deleted at ${path}`);
                const parent = getChangeParent(document, change)
                log("parent: " + parent.name)
                handleGroupChanges(parent)
                break;
            case 3: // Addition                
                if (change.isMove()) {
                    log(`Object moved from ${change.associatedChange().fullPath()} to ${path}`)

                    const oldParent = getChangeParent(document, change.associatedChange())
                    handleGroupChanges(oldParent)

                    const newParent = sketch.fromNative(change.object()).parent
                    handleGroupChanges(newParent)
                } else {
                    log(`New object inserted at ${path}`);
                }
                break;
            default:
                log(`⚠️ Unexpected change type ${type}`);
        }
    }
};


function getChangeParent(document, change) {
    return eval(`document.${change.fullPath().toString().match(/(.*)\./)[1]}`)
}

function handleGroupChanges(parent) {
    adjustLayers(parent.layers, true)
    adjustLayers(parent.layers, false)


}

function adjustLayers(layers, isX) {
    if (isX)
        layers = layers.slice().sort((a, b) => a.frame.x + a.frame.width - (b.frame.x + b.frame.width))
    else
        layers = layers.slice().sort((a, b) => a.frame.y + a.frame.height - (b.frame.y + b.frame.height))

    const spacerName = "@" + (isX ? "X" : "Y") + "Spacer@"
    const perpSpacerName = "@" + (isX ? "Y" : "X") + "Spacer@"

    layers.forEach(function (child, index) {
        const isSpacer = child.name.includes(spacerName)
        if (!isSpacer) return

        let pos = isX ? child.frame.x + child.frame.width : child.frame.y + child.frame.height
        let oldPos = null

        //log(layers.slice(index + 1))
        layers.slice(index + 1).forEach(function (l) {
            const isPerpSpacer = l.name.includes(perpSpacerName)
            if (isPerpSpacer) return
            // if the next object on the same position
            const lPos = isX ? l.frame.x : l.frame.y
            if (oldPos != null && lPos == oldPos) {
                pos = oldPos
            }
            //            
            log("name: " + l.name)
            const delta = pos - lPos
            if (isX)
                l.frame.x += delta
            else
                l.frame.y += delta
            oldPos = pos
            pos += isX ? l.frame.width : l.frame.height
        }, this)
    }, this)
}