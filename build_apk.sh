#!/bin/sh
# 안드로이드 APK 빌드 (Android SDK build-tools 34 + platform 34 필요, JDK 필요)
# 서명 키는 저장소 밖(SDK 폴더)에 보관한다. 같은 키로 서명해야 기존 앱 위에 업데이트 설치가 된다.
set -e
cd "$(dirname "$0")"
SDK="${SDK:-/c/Users/mir48/android-sdk-min}"
command -v cygpath >/dev/null 2>&1 && SDK="$(cygpath -m "$SDK")"
BT="$SDK/bt/android-14"
JAR="$SDK/pf/android-34/android.jar"
KS="$SDK/overclock.keystore"
PASSFILE="$SDK/keystore.pass"
OUT=apk-build
sh build.sh
rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/compiled" "$OUT/classes" "$OUT/dex"
cp index.html "$OUT/assets/index.html"
"$BT/aapt2.exe" compile --dir android/res -o "$OUT/compiled"
"$BT/aapt2.exe" link -I "$JAR" --manifest android/AndroidManifest.xml -A "$OUT/assets" \
  --min-sdk-version 24 --target-sdk-version 34 -o "$OUT/base.apk" $(ls "$OUT"/compiled/*.flat)
javac -encoding UTF-8 --release 8 -nowarn -classpath "$JAR" -d "$OUT/classes" android/src/com/overclock/game/*.java 2>&1 | grep -v "warning" || true
"$BT/d8.bat" --release --min-api 24 --lib "$JAR" --output "$OUT/dex" $(find "$OUT/classes" -name "*.class")
python - "$OUT" <<'PY'
import sys, zipfile
out = sys.argv[1]
with zipfile.ZipFile(out + '/base.apk', 'a', zipfile.ZIP_DEFLATED) as z:
    z.write(out + '/dex/classes.dex', 'classes.dex')
PY
"$BT/zipalign.exe" -p -f 4 "$OUT/base.apk" "$OUT/aligned.apk"
if [ ! -f "$KS" ]; then
  python -c "import secrets; print(secrets.token_urlsafe(18))" > "$PASSFILE"
  keytool -genkeypair -keystore "$KS" -alias overclock -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$(cat "$PASSFILE")" -keypass "$(cat "$PASSFILE")" -dname "CN=Overclock, O=Overclock" >/dev/null 2>&1
fi
"$BT/apksigner.bat" sign --v4-signing-enabled false --ks "$KS" --ks-pass "file:$PASSFILE" --out overclock.apk "$OUT/aligned.apk"
"$BT/apksigner.bat" verify overclock.apk && echo "built overclock.apk ($(wc -c < overclock.apk) bytes)"
