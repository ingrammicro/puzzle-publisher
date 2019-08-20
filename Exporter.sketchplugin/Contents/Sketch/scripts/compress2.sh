#!/bin/bash
# This Export plugin script resizes all the images it finds in a folder and resizes them
# The resized image is placed in the /resized folder which will reside in the same directory as the image
#
# Usage: > ./compres.sh IMG_FOLDER /Temp/advpng

initial_folder="$1" # You can use "." to target the folder in which you are running the script for example
app="$2"

## go to images folder
cd "$initial_folder"
if [ $? != 0 ]; then
    echo "Error: can't open folder '${initial_folder}'"
    exit 1
fi	

"${app}" -2 -z *.png 