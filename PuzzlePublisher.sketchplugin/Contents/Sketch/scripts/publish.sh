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

tmpFolder="${orgTmpFolder}/"

storyVerPlaceholderCode="VERSION_INJECT=' "

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

uploadReadyMockups
