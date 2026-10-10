
#!/bin/sh
set -eu

JS_FILES="src/container.js src/dictionary.js src/painter.js src/tools.js src/commands.js src/actions.js src/widgets.js src/lz-string.js"
CSS_FILES="src/neo.css"
DEST="dist"

build() {
  NAME=$(node -p "require('./package.json').name")
  VERSION=$(node -p "require('./package.json').version")
  mkdir -p "$DEST"

  # JS: 結合(ファイルの間に改行を挟む。gulp-concat と同じ) + バージョン置換
  first=1
  for f in $JS_FILES; do
    [ "$first" = 0 ] && printf '\n'
    cat "$f"
    first=0
  done | sed "s/PACKAGE_JSON_VERSION/$VERSION/g" > "$DEST/neo.js"
  cp "$DEST/neo.js" "$DEST/$NAME-$VERSION.js"

  # CSS
  first=1
  for f in $CSS_FILES; do
    [ "$first" = 0 ] && printf '\n'
    cat "$f"
    first=0
  done > "$DEST/neo.css"
  cp "$DEST/neo.css" "$DEST/$NAME-$VERSION.css"

  echo "built $NAME-$VERSION"
}

build

# `sh build.sh watch` で、変更を検知して再ビルド
if [ "${1:-}" = "watch" ]; then
  last=""
  while true; do
    now=$(cat $JS_FILES $CSS_FILES package.json | md5sum)
    if [ "$now" != "$last" ]; then
      [ -n "$last" ] && build
      last="$now"
    fi
    sleep 1
  done
fi