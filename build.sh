#!/bin/sh
# src/ 조각들을 하나의 HTML 파일로 합친다
cd "$(dirname "$0")"
cat src/00_head.html src/*.js src/99_tail.html > overclock.html
echo "built overclock.html ($(wc -c < overclock.html) bytes)"
# 웹 게시용: 문서 골격 태그 제거 (게시할 때 자동으로 감싸짐)
if [ -n "$1" ]; then
  python - "$1" <<'PY'
import sys,re
s=open('overclock.html',encoding='utf-8').read()
for t in ['<!DOCTYPE html>\n','<html lang="ko">\n','<head>\n','<meta charset="utf-8">\n','<meta name="viewport" content="width=device-width,initial-scale=1">\n','</head>\n','<body>\n','</body>\n','</html>\n']:
    assert t in s, t
    s=s.replace(t,'',1)
open(sys.argv[1],'w',encoding='utf-8').write(s)
print('built', sys.argv[1])
PY
fi
