
#!/bin/sh
set -eu

JS_FILES="src/container.ts src/dictionary.ts src/painter.ts src/tools.ts src/commands.ts src/actions.ts src/widgets.ts src/lz-string.ts"
CSS_FILES="src/neo.css"
DEST="dist"

build() {
  NAME=$(node -p "require('./package.json').name")
  VERSION=$(node -p "require('./package.json').version")
  mkdir -p "$DEST"

  # TypeScript: tsconfig.json の files 順にコンパイル済み JavaScript を連結する。
  pnpm exec tsc --project tsconfig.json
  first=1
  for f in $JS_FILES; do
    compiled=".tsbuild/${f#src/}"
    compiled="${compiled%.ts}.js"
    [ "$first" = 0 ] && printf '\n'
    cat "$compiled"
    first=0
  done | sed "s/PACKAGE_JSON_VERSION/$VERSION/g" | sed 's/[[:space:]]*$//' > "$DEST/neo.js"
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
    now=$(cat $JS_FILES $CSS_FILES package.json tsconfig.json | md5sum)
    if [ "$now" != "$last" ]; then
      [ -n "$last" ] && build
      last="$now"
    fi
    sleep 1
  done
fi
