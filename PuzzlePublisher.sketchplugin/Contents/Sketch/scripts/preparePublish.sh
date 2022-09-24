#!/bin/bash

ver="$1"
allMockupsFolder="$2"
docFolder="$3"
remoteFolder="$4"
docPathValue="$5"
mirror1="$6"
sshPort="$7"
authorName="$8"
authorEmail="$9"
commentsURL=${10}
orgTmpFolder="${11}"

skipLive=""

docPathPlaceholder="P_P_P"
docVerPlaceholder="V_V_V"
DOCUMENT_AUTHOR_NAME_PLACEHOLDER="V_V_N"
DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER="V_V_E"
DOCUMENT_COMMENTS_URL_PLACEHOLDER="V_V_C"
storyVerPlaceholder='VERSION_INJECT=""'

#orgTmpFolder="$(mktemp -d)/"
#orgTmpFolder="/Users/Baza/Temp/"
tmpFolder="${orgTmpFolder}/"
mkdir -p "${tmpFolder}"

storyVerPlaceholderCode="VERSION_INJECT=' "

echo "$commentsURL"
echo "$tmpFolder"

waitCompressor(){
    SERVICE="advpng"
    while pgrep -x "$SERVICE" >/dev/null
    do
        sleep 2
    done
}

prepareMockups()
{	
    echo $tmpFolder$verFolder

	rm -rf "${tmpFolder}"
	mkdir -p "$tmpFolder"$verFolder	            

	# copy to version
	echo "-- prepare temp folder"
	cp -R "${allMockupsFolder}/${docFolder}/" "${tmpFolder}"
	
    # inject version
    if [ "$ver" != "-1" ]; then
        sed -i '' "s/${storyVerPlaceholder}/${storyVerPlaceholderCode}(v${ver})'/g" "${tmpFolder}/js/Viewer.js"	
        sed -i '' "s/${docPathPlaceholder}/${docPathValue}/g" "${tmpFolder}/data/story.js"
        sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}/data/story.js"	
        sed -i '' "s/${DOCUMENT_AUTHOR_NAME_PLACEHOLDER}/${authorName}/g" "${tmpFolder}/data/story.js"	
        sed -i '' "s/${DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER}/${authorEmail}/g" "${tmpFolder}/data/story.js"	
        sed -i '' "s/${DOCUMENT_COMMENTS_URL_PLACEHOLDER}/${commentsURL}/g" "${tmpFolder}/data/story.js"	
        sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}/index.html"	      
    fi
}

prepareMockups
