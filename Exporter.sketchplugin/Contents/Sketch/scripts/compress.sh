#!/bin/bash
# This Export plugin script resizes all the images it finds in a folder and resizes them
# The resized image is placed in the /resized folder which will reside in the same directory as the image
#
# Usage: > ./compres.sh IMG_FOLDER FULLPATH_TO_pngquant

initial_folder="$1" # You can use "." to target the folder in which you are running the script for example
app="$2"

## go to images folder
cd "$initial_folder"
if [ $? != 0 ]; then
    echo "Error: can't open folder '${initial_folder}'"
    exit 1
fi	

## check if this folder images were already compressed
if [ -f _compressed ]; then
    exit 0
fi

## run pngquant to compress all *.png files into *.gnp
${app} --force --quality=60-80 --ext .gnp -- *.png
if [ $? != 0 ]; then
    echo "Error: can't find pngquant tool.  Get it here - https://pngquant.org"
    exit 1
fi
## drop old PNG files
rm *.png
## rename all GNP files into PNG
for file in *.gnp; do mv "$file" "${file/.gnp/.png}"; done
## mark this folders as already compressed
touch _compressed