# VideoGrabber Desktop

A modern, high-performance, and secure Windows desktop application for analyzing and downloading videos and audio from supported platforms using local external engines (`yt-dlp` and `FFmpeg`).

Built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, and **Zustand**.

---

## 🌟 Key Features

- **Local Execution:** No remote servers or personal cloud backends required. Downloads are processed directly on your Windows PC.
- **Rich Media Analysis:** Inspect available resolutions, video/audio formats, thumbnails, duration, and uploader metadata prior to downloading.
- **Audio Extraction:** Convert media directly to high-quality MP3 when FFmpeg is detected.
- **Real-Time Progress Tracking:** Live download percentage, download speed (MB/s), ETA countdown, and file sizes parsed from native engine events.
- **Download Queue Management:** Concurrency limiter, pause/resume mechanisms, retry for transient network interruptions, and duplicate prevention.
- **Persistent History & Settings:** Searchable download history with native Windows file/folder reveal integration; custom download directory choices.
- **Enterprise-Grade Security:**
  - Context isolation enabled (`contextIsolation: true`)
  - Node integration disabled in the renderer (`nodeIntegration: false`)
  - Strict Content Security Policy (CSP)
  - Argument array spawning (zero shell interpolation, preventing command injection)
  - Filename sanitization protecting against Windows reserved device names and directory traversal (`..`)

---

## 💻 Tech Stack

- **Desktop Shell:** Electron 28
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Dark theme with custom violet accents)
- **Icons:** Lucide React
- **State Management:** Zustand
- **Local Persistence:** electron-store
- **Engines:** yt-dlp & FFmpeg

---

## 📋 Prerequisites

1. **Node.js**: `v20.x` or higher (tested on Node v24).
2. **npm**: `v10.x` or higher.
3. **yt-dlp**: Required for fetching media streams.
4. **FFmpeg**: Required for audio extraction, muxing, and high-definition streams.

### Installing yt-dlp & FFmpeg on Windows:

Using **winget** (Recommended):
```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

Or using **Chocolatey**:
```powershell
choco install yt-dlp
choco install ffmpeg
```

---

## 🚀 Development Setup

1. **Clone or navigate to the repository:**
   ```powershell
   cd c:\projects\DownloadManagerApp
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Run in development mode:**
   ```powershell
   npm run electron:dev
   ```

4. **Execute automated tests:**
   ```powershell
   npm run test
   ```

5. **Typecheck & Lint:**
   ```powershell
   npm run typecheck
   ```

---

## 📦 Building the Windows Installer

To build an unpacked standalone executable and the NSIS installer (`.exe`):

```powershell
npm run dist:win
```

The output installers and unpacked portable executables will be generated in the `release/` directory:
- `release/VideoGrabber Desktop Setup 1.0.0.exe` (NSIS Installer)
- `release/win-unpacked/VideoGrabber Desktop.exe` (Standalone portable folder)

### Code Signing & Windows SmartScreen Notice
> **Note on Windows Code Signing:**
> The built installer is unsigned by default. When running an unsigned binary on Windows 10/11, Windows Defender SmartScreen may display an alert ("Windows protected your PC"). Click **"More info"** -> **"Run anyway"** to launch. For commercial distributions, sign the executable using an EV code-signing certificate via `electron-builder`.

---

## 🔒 Security Best Practices Implemented

1. **Context Isolation**: Renderer execution operates in an isolated world with strict bridge boundaries.
2. **Safe Spawning**: All `yt-dlp` and `ffmpeg` processes are executed with fixed argument arrays (`child_process.spawn(['--newline', ...])`). User inputs are never passed into a shell string.
3. **Path Sanitization**: User-selected file destinations and video titles are stripped of reserved characters (`<>:"/\|?*`) and path traversal tokens (`..`).
4. **Link Allowlist**: Only explicit domains (GitHub releases, FFmpeg documentation) are permitted to open externally in default browsers.

---

## ⚖️ Legal & Permitted-Use Policy

VideoGrabber Desktop is designed strictly for downloading media where technically and legally permitted:
- Public domain material
- Content licensed under Creative Commons or open-access provisions
- Personal archival of media you own or have explicit authorization to download

Users are responsible for respecting website terms of service and applicable intellectual property copyright laws. The app does not circumvent DRM, paywalls, private credentials, or access tokens.

---

## 📄 Licenses

- **VideoGrabber Desktop**: Licensed under the [MIT License](resources/legal/LICENSE.txt).
- **yt-dlp**: The Unlicense (Public Domain).
- **FFmpeg**: LGPL / GPL.
- **Electron**: MIT License.
# VIDEOS_DOWNLOADER
