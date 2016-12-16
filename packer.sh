#!/bin/sh

electron-packager ./neo neo --platform=darwin,win32 --arch=all --overwrite --version=1.4.8

for f in neo-darwin-x64 neo-win32-ia32 neo-win32-x64; do
    echo compress $f.zip...
    ditto -c -k --sequesterRsrc --keepParent $f $f.zip 
done

echo "done."
