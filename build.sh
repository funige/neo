#!/bin/sh
set -eu

CSS_FILES="src/neo.css"
DEST="dist"

build() {
  NAME=$(node -p "require('./package.json').name")
  VERSION=$(node -p "require('./package.json').version")
  mkdir -p "$DEST"

  # JS: ESモジュールをバンドル + バージョン置換
  BANNER="/*! PaintBBS NEO v$VERSION | https://github.com/funige/neo */
$(cat src/THIRD-PARTY-LICENSES.txt)"

  ./node_modules/.bin/esbuild src/container.js \
    --bundle \
    --format=iife \
    --target=es2015 \
    --external:electron \
    --banner:js="$BANNER" \
    --outfile="$DEST/neo.js"

  sed "s/PACKAGE_JSON_VERSION/$VERSION/g" \
    "$DEST/neo.js" > "$DEST/neo.tmp.js"
  mv "$DEST/neo.tmp.js" "$DEST/neo.js"

  cp "$DEST/neo.js" "$DEST/$NAME-$VERSION.js"

  # CSS
  cat $CSS_FILES > "$DEST/neo.css"
  cp "$DEST/neo.css" "$DEST/$NAME-$VERSION.css"

  echo "built $NAME-$VERSION"
}

build

# `sh build.sh watch` で変更を検知して再ビルド
if [ "${1:-}" = "watch" ]; then
  last=""
  while true; do
    now=$(find src -type f \( -name '*.js' -o -name '*.css' -o -name '*.txt' \) -print0 |
      sort -z | xargs -0 cat | cat - package.json | md5sum)
    if [ "$now" != "$last" ]; then
      [ -n "$last" ] && build
      last="$now"
    fi
    sleep 1
  done
fi
