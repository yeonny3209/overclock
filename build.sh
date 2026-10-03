#!/bin/sh
# src/ 조각들을 하나의 HTML 파일로 합친다
cd "$(dirname "$0")"
cat src/00_head.html src/*.js src/99_tail.html > overclock.html
cp overclock.html index.html
echo "built overclock.html ($(wc -c < overclock.html) bytes)"
