# ToolBox mobile app (Expo / React Native)

iOS and Android app for [ToolBox](https://toolbox.otaga.in), an [Otaga](https://otaga.in) product.

## How it is built
- **16 native tools** that work offline: Merge PDF, Split PDF, JPG to PDF, Compress Image (exact KB), Resize Image, Image Converter, JSON Formatter, Base64, URL Encoder, UUID, JWT Decoder, Regex Tester, QR Code, Word Counter, Password Generator, Unit Converter.
- **25 more tools** open the website tool inside the app (`react-native-webview`). Downloads from the website are passed to the phone's share sheet ("Save to Files", Drive, WhatsApp, ...). The site detects the app (`ToolBoxApp` in the user agent) and hides its header, footer and ads.
- Expo SDK 58, `expo-router`, TypeScript, `pdf-lib` for PDFs, `expo-image-manipulator` for images.
- Heavy tools (video, OCR, background removal) are not ported natively because they rely on browser-only engines (FFmpeg.wasm, Tesseract, ONNX).

## Run it
```bash
cd mobile
npm install
npx expo start          # scan the QR code with Expo Go, or press a / i for an emulator / simulator
npm run typecheck       # TypeScript
npm run test:logic      # PDF, encoding, converter and password logic tests
```
Set `EXPO_PUBLIC_SITE_URL` if the website is not at `https://toolbox.otaga.in`.

## Publish
You need an **Expo account** (free), a **Google Play Console** account (one-time US$25) and an **Apple Developer Program** membership (US$99 a year).

```bash
npm install -g eas-cli
eas login
eas init                                   # links the project, fills in extra.eas.projectId
eas build --platform android --profile production   # makes an .aab for Google Play
eas build --platform ios --profile production       # EAS asks you to sign in to Apple and creates certificates
eas submit --platform android              # needs a Play service-account key, or upload the .aab by hand
eas submit --platform ios
```
Test builds you can install on your own phone: `eas build --platform android --profile preview` (APK).

Store text, privacy answers and review notes are in [`store/LISTING.md`](store/LISTING.md). Package / bundle id: `in.otaga.toolbox`.

### Before the first submission
1. Replace the placeholder screenshots in `store/screenshots` with real device or simulator captures if you can.
2. Check that `https://toolbox.otaga.in/privacy` is live (both stores require a privacy policy URL).
3. Google Play: new personal developer accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to production.
4. App Store: answer the privacy questionnaire (see `LISTING.md`) and add the review notes.

## Version numbers
Bump `version` in `app.json` for each release. `eas.json` is set to auto-increment the build number / version code.
