#!/bin/sh

#if [ $# -ne 1 ]; then
#   echo "run with version string.\n\n $0 version-string\n" 1>&2
#   exit 1
#fi

#for f in in neo-darwin-x64 neo-win32-ia32 neo-win32-x64; do
#    mv $f.zip old/$f-$1.zip
#    rm -rf $f
#done

electron-packager ./neo neo --platform=darwin,win32 --arch=all --overwrite --version=1.4.0

for f in neo-darwin-x64 neo-win32-ia32 neo-win32-x64; do
    echo compress $f.zip...
    ditto -c -k --sequesterRsrc --keepParent $f $f.zip 
done

echo "done."
