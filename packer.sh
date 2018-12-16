#!/bin/sh

electron-packager ./neo neo --platform=darwin,win32 --arch=all --overwrite

for f in neo-darwin-x64 neo-win32-ia32 neo-win32-x64; do
    echo compress $f.zip...
    ditto -c -k --sequesterRsrc --keepParent $f $f.zip
    mv $f.zip app/
done

rm samplebbs/index.html samplebbs/[1-9].html samplebbs/tree.log
rm samplebbs/src/* samplebbs/thumb/* samplebbs/tmp/* samplebbs/log/*
zip -qyr samplebbs.zip samplebbs

echo "done."
