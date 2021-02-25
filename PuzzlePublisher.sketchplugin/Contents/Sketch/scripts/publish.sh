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

skipLive=""

docPathPlaceholder="P_P_P"
docVerPlaceholder="V_V_V"
DOCUMENT_AUTHOR_NAME_PLACEHOLDER="V_V_N"
DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER="V_V_E"
DOCUMENT_COMMENTS_URL_PLACEHOLDER="V_V_C"
storyVerPlaceholder='VERSION_INJECT=""'

orgTmpFolder="$(mktemp -d)/"
#orgTmpFolder="/Users/Baza/Temp/"
tmpFolder="${orgTmpFolder}${remoteFolder}/"
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
    verFolder="${ver}/"
    if [ "$ver" == "-1" ]; then
        verFolder=""
    fi

    echo $tmpFolder$verFolder

	rm -rf "${tmpFolder}"
	mkdir -p "$tmpFolder"$verFolder	            

	# copy to version
	echo "-- prepare temp folder"
	cp -R "${allMockupsFolder}/${docFolder}/" "${tmpFolder}${verFolder}"
	
    # inject version
    if [ "$ver" != "-1" ]; then
        sed -i '' "s/${storyVerPlaceholder}/${storyVerPlaceholderCode}(v${ver})'/g" "${tmpFolder}${ver}/viewer/viewer.js"	
        sed -i '' "s/${docPathPlaceholder}/${docPathValue}/g" "${tmpFolder}${ver}/viewer/story.js"
        sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}${ver}/viewer/story.js"	
        sed -i '' "s/${DOCUMENT_AUTHOR_NAME_PLACEHOLDER}/${authorName}/g" "${tmpFolder}${ver}/viewer/story.js"	
        sed -i '' "s/${DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER}/${authorEmail}/g" "${tmpFolder}${ver}/viewer/story.js"	
        sed -i '' "s/${DOCUMENT_COMMENTS_URL_PLACEHOLDER}/${commentsURL}/g" "${tmpFolder}${ver}/viewer/story.js"	
        sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}${ver}/index.html"	
        
        if [ "$skipLive" == "" ]; then
            # copy version to live
            cp -R "${allMockupsFolder}/${docFolder}/" "${tmpFolder}live"
            sed -i '' "s/${storyVerPlaceholder}/${storyVerPlaceholderCode}(v${ver})';/g" "${tmpFolder}live/viewer/viewer.js"
            sed -i '' "s/${docPathPlaceholder}/${docPathValue}/g" "${tmpFolder}live/viewer/story.js"
            sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}live/viewer/story.js"
            sed -i '' "s/${DOCUMENT_AUTHOR_NAME_PLACEHOLDER}/${authorName}/g" "${tmpFolder}live/viewer/story.js"
            sed -i '' "s/${DOCUMENT_AUTHOR_EMAIL_PLACEHOLDER}/${authorEmail}/g" "${tmpFolder}live/viewer/story.js"
            sed -i '' "s/${DOCUMENT_COMMENTS_URL_PLACEHOLDER}/${commentsURL}/g" "${tmpFolder}live/viewer/story.js"
            sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}live/index.html"

        fi
    fi
}

#arguments: remoteFolder (nextcp/ux-framework/providercp)
uploadReadyMockups()
{

	echo "-- publish to mirror1 site from ${orgTmpFolder} to ${mirror1}/"
	rsync -e "ssh -p $sshPort" -r "$orgTmpFolder" "${mirror1}/"

	if [ $? != 0 ]; then
		exit 1
	fi	

} 

if [ "$ver" == "" ]; then
	if [ "$docFolder" == "" ]; then
		if [ "$remoteFolder" == "" ]; then
			echo "ERROR - not all arguments specified"
			echo "format: publish.sh VERSION ALLMOCKUPSFOLDER DOCFOLDER REMOTEFOLDER SITE SSHPORT(optional)"
			exit 1
		fi
	fi
fi

#waitCompressor
prepareMockups
uploadReadyMockups
