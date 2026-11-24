# SPARK app (Android) — The SPARK is within YOU.

Capacitor wrapper around `app/index.html` with a native step counter. Beginners: read `START-HERE.txt` first.

```
app/            index.html (the whole app UI) + fonts/ + assets/ (emblem, wordmark)
icon/           Android launcher icons generated from the SPARK emblem
scripts/        copy-www.js, patch-android.js (adds step counter service, permissions, icon)
tests/          browser tests of the UI and logic
.github/workflows/build-apk.yml   builds the APK on GitHub (no Android Studio needed)
capacitor.config.json, package.json
```

## Build
GitHub Actions (recommended): see `START-HERE.txt`. The workflow installs Node 20 and Java 21, runs `npm run setup`, builds `app-debug.apk` and uploads it as the artifact **SPARK-APK**. Tests and the release build run afterwards as optional steps; if they fail the APK is unaffected.

Locally (needs JDK 21 and the Android SDK):
```bash
npm install
npm run setup
cd android && ./gradlew assembleDebug     # output: android/app/build/outputs/apk/debug/app-debug.apk
```
Tests (UI and logic in Chromium): `npx playwright install chromium && npm test`.

## Website address
The app talks to the site's leaderboard at `https://sparkofc.netlify.app` (the `SITE` constant near the top of the script in `app/index.html`). If your Netlify address is different, change it there and build again.

## Optional signed release
Add repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`; the workflow then also uploads `SPARK-release-signed-apk`. Create a keystore once with `keytool -genkey -v -keystore spark.jks -keyalg RSA -keysize 2048 -validity 10000 -alias spark` and keep it safe.

## Tested vs not tested
Tested (Chromium, phone size, light and dark): first-launch emblem boot and welcome, home roadmap and next milestone, theme tokens, no manual step entry, energy range, quick water add, reminder consent/quiet hours/pause, developer links, all six Moments PNG exports, reduced motion. The icon install step was dry-run on a fake Android tree.
Not tested here (needs a phone): the Gradle build, the real step sensor, scheduled notifications firing, native share/save, Android's own launch splash.

## Limitations
No Health Connect (steps come from the phone's step sensor). Leaderboard totals are phone-reported and only plausibility-checked. Reminders are scheduled with a 3-day horizon and refreshed when the app opens; Android battery saver can delay them. Android's system splash cannot show the animated emblem (OS limit); the animation starts as soon as the app opens. Fonts: SIL Open Font License.
