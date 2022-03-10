#!/bin/bash

tempDir="$1"
fileName="$2"
docName="$3"
exportOptions="$4"

SKETCH=$(mdfind kMDItemCFBundleIdentifier=='com.bohemiancoding.sketch3' | head -n 1)

"$SKETCH/Contents/MacOS/sketchtool" detach ${fileName}
"$SKETCH/Contents/MacOS/sketchtool" run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/PuzzlePublisher.sketchplugin "cmdRun"  --context='{\"file\":\"${fileName}\",\"name\":\"${docName}\",\"commands\":\"export,close\",\"async\":true,\"exportOptions\":\"${exportOptions}\"}'
rm $fileName
#${dstSketchPath}/Contents/Resources/sketchtool/bin/sketchtool --new-instance=YES --concurrent=YES --wait-for-exit=NO --without-activating=YES run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/PuzzlePublisher.sketchplugin "cmdRun"  --context="{\"file\":\"${fileName}\",\"name\":\"${docName}\",\"commands\":\"export,close\",\"async\":true}"
#rm $fileName
#kill $(ps -Ac -o pid,comm | awk '/^ *[0-9]+ Sketch$/ {print $1}' | tail -n 1)