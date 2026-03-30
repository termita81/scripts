#!/bin/bash

# move
exiftool -r -d '%Y.%m.%d' '-Directory<$DateTimeOriginal' .

# copy
# exiftool -r -o . -d '%Y.%m.%d' '-Directory<$DateTimeOriginal' .
