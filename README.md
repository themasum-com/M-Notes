<p align="center">
  <img src="assets/logo.png" width="128" height="128" alt="M Notes Logo" style="border-radius: 28px;" />
</p>

<h1 align="center">M Notes</h1>

<p align="center">
  <strong>Private, Offline-First, Hardware-Encrypted Note Taking for Android</strong><br>
  <em>A distraction-free, minimalist writing space built with bank-grade security.</em>
</p>

<p align="center">
  <a href="https://github.com/themasum-com/M-Notes/releases/latest">
    <img src="https://img.shields.io/github/v/release/themasum-com/M-Notes?color=F59E0B&label=Latest%20Release&logo=github" alt="Latest Release" />
  </a>
  <a href="https://github.com/themasum-com/M-Notes/actions/workflows/build-apk.yml">
    <img src="https://github.com/themasum-com/M-Notes/actions/workflows/build-apk.yml/badge.svg" alt="Build and Release" />
  </a>
  <a href="#security--architecture">
    <img src="https://img.shields.io/badge/Security-AES--256--GCM-10B981.svg" alt="AES-256-GCM Encryption" />
  </a>
  <a href="#100-offline--zero-telemetry">
    <img src="https://img.shields.io/badge/Privacy-100%25_Offline-8B5CF6.svg" alt="100% Offline" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-3B82F6.svg" alt="MIT License" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/themasum-com/M-Notes/releases/latest/download/M-Notes.apk">
    <img src="https://img.shields.io/badge/Download_APK-M--Notes.apk-2ea44f?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
  </a>
</p>

---

## 🌟 Overview

**M Notes** is a secure, offline-first personal notes application for Android designed with two core principles: **absolute privacy** and a **calm, distraction-free writing experience**. 

Most modern note apps require account creation, sync to unknown cloud servers, and track telemetry. **M Notes takes the opposite approach**:
- 🚫 **No internet access**: The Android manifest strictly blocks `android.permission.INTERNET`. Not a single byte can leave your device.
- 🔐 **Authenticated AES-256-GCM Encryption**: Every note title, body, and folder configuration is encrypted with a device-unique 256-bit master key before touching storage.
- 🛡️ **Hardware Keystore & Biometrics**: Unlocked via your fingerprint, Face ID, or system PIN, backed by hardware-protected storage.
- ✍️ **Notion-Inspired Simplicity**: Clean typography, warm color accents (`#FED766`), real-time word/character counting, and estimated reading time.
- 📂 **Folders & Organization**: Organize thoughts into default or custom folders with dynamic note counts and rapid search.
- 📤 **Clean Exports**: Export individual notes at any time to Markdown (`.md`) or Plain Text (`.txt`) via the Android system share sheet.

---

## 📱 Quick Download

Get the latest standalone Android APK directly from GitHub Releases:

| Release | File | Action |
| :--- | :--- | :--- |
| **Latest Release** | `M-Notes.apk` | [**Download Raw APK**](https://github.com/themasum-com/M-Notes/releases/latest/download/M-Notes.apk) |
| **All Releases** | Release changelogs & tags | [**View GitHub Releases**](https://github.com/themasum-com/M-Notes/releases) |

> **Installation Note**: Because M Notes is distributed directly as an APK without Google Play Services, your Android device may prompt to *"Allow installation from unknown sources"*. Simply grant permission to your browser/file manager to proceed.

---

## ✨ Features

### 🔒 Security & Privacy First
- **Zero Internet Permissions**: `android.permission.INTERNET` is explicitly blocked in `app.json`. The application literally cannot communicate over the network.
- **AES-256-GCM Cryptography**: Uses `@noble/ciphers` with 12-byte cryptographically secure random nonces (IVs) and GCM authentication tags. Any external tampering or disk corruption renders the file rejected immediately.
- **Hardware-Protected Master Key**: Generated via cryptographically secure random bytes on initial launch and preserved in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keychain accessibility.
- **Anti-Screenshot & App-Switcher Shield**: Employs Android `FLAG_SECURE` (`expo-screen-capture`) to block screenshots, video capture, and prevent notes from being visible in Android's recent apps switcher.
- **Auto-Lock on Background**: Instantly triggers biometric lock screen whenever the app is minimized, sent to the background, or device is locked.

### 📝 Effortless Writing
- **Distraction-Free Editor**: Seamless, clean markdown-friendly editor designed for rapid thought capture.
- **Live Writing Stats**: Real-time word count, character count, and estimated reading time displayed discreetly.
- **Auto-Save**: Changes persist seamlessly to encrypted storage as you write.
- **Quick Folders**: Filter notes with intuitive horizontal category pills (`All`, `General`, `Personal`, `Work`, `Ideas`, or custom created folders).
- **Fast Search**: Instant real-time search across note titles and contents.

### 📤 Freedom & Portability
- **No Vendor Lock-In**: Export any note to standard Markdown (`.md`) or Plain Text (`.txt`).
- **System Share Integration**: Seamlessly share exported files with external apps, email, or local backups.
- **Safe Filename Sanitization**: Preserves international unicode characters while neutralizing invalid filesystem characters.

---

## 📐 Architecture

```
                    +-----------------------------+
                    |      User Interface         |
                    | (React Native / Expo SDK 58)|
                    +--------------+--------------+
                                   |
                  +----------------v----------------+
                  |    Security Lock & Biometrics   |
                  |  (LocalAuthentication / Secure) |
                  +----------------+----------------+
                                   |
                  +----------------v----------------+
                  |        Security Service         |
                  |   AES-256-GCM (@noble/ciphers)  |
                  |    Hardware Master Key via      |
                  |       Expo SecureStore          |
                  +----------------+----------------+
                                   |
                  +----------------v----------------+
                  |        Storage Service          |
                  | Sandboxed App Document Storage  |
                  |  - index.enc.json (Metadata)    |
                  |  - folders.enc.json (Folders)   |
                  |  - notes/{id}.enc.json (Notes)  |
                  +---------------------------------+
```

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 58](https://expo.dev) with [React Native 0.88](https://reactnative.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Cryptography**: [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers) (Audited, zero-dependency AES-256-GCM implementation)
- **Biometrics & Hardware Storage**: `expo-local-authentication`, `expo-secure-store`, `expo-crypto`
- **Security Protections**: `expo-screen-capture` (Android `FLAG_SECURE`)
- **Testing**: Node.js Native Test Runner with `tsx` for high-speed isolated security and storage unit tests

---

## 💻 Development & Building

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) (v10+)
- [Java JDK 17](https://adoptium.net/) (for building Android natively)
- [Android Studio / Android SDK](https://developer.android.com/studio) (for local APK compilation)

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/themasum-com/M-Notes.git
   cd M-Notes
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npx expo start
   ```

4. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```
   *Runs comprehensive unit tests verifying AES-256-GCM encryption/decryption, tamper detection, secure storage CRUD, folder counts, and filename sanitization.*

5. **Typecheck & Lint**:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

### Building the Standalone Release APK Locally

M Notes uses Continuous Native Generation (CNG) via Expo Prebuild:

1. **Generate the native Android project**:
   ```bash
   npx expo prebuild --platform android --clean --no-install
   ```

2. **Compile the standalone Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The built APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.*

---

## 🚀 Automated GitHub Releases & CI/CD

This repository includes a continuous integration and release pipeline configured in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml):

- **Pull Requests & Branch Pushes**: Automatically executes `npm test`, `npx tsc --noEmit`, `npm run lint`, builds the standalone Release APK, and uploads it to GitHub Actions Workflow Artifacts.
- **Tag Pushes (`v*`)**: Whenever a new tag is pushed (e.g. `v1.0.0`), GitHub Actions builds the production standalone APK and automatically publishes a official **GitHub Release**:
  - Direct download file: `M-Notes.apk`
  - Versioned release file: `M-Notes-v1.0.0.apk`
  - Release changelog generated from git commits

To publish a new release:
```bash
git tag v1.0.0
git push origin master --tags
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
Feel free to use, modify, and distribute according to the terms of the license.
