#!/bin/bash

fileName="$1"
docName="$2"
/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool --wait-for-exit=NO --without-waiting=NO --without-activating=YES --new-instance=YES run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/PuzzlePublisher.sketchplugin "cmdRun"  --context="{\"file\":\"${fileName}\",\"name\":\"${docName}\",\"commands\":\"export\",\"async\":true}"
rm $fileName
kill $(ps -Ac -o pid,comm | awk '/^ *[0-9]+ Sketch$/ {print $1}' | tail -n 1)