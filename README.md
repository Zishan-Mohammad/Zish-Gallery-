# Zish-Gallery: Private Password-Protected Photo & Video Vault (Client-Side Only)

> **Important Security & Privacy Disclaimer**  
> **"This application provides client-side privacy features only. It does not provide server-side access control. Anyone who has access to the local folder or application source can potentially bypass client-side protection."**  
> Zish-Gallery is designed exclusively for personal and local privacy convenience. It does not advertise military-grade, server-grade, or tamper-proof encryption.

---

## 1. What the Application Does

**Zish-Gallery** is a 100% frontend private media vault where your photos and videos are permanently and securely accessible without requiring any folder selection dialogs, category compartments, or cloud servers.

- **Unified Media Stream (No Compartments):** All photos and videos sit in a clean, flat media vault with zero compartments, subfolder tags, or category divisions.
- **Full Video & Photo Support:** Supports `.mp4`, `.webm`, `.mov`, `.ogg`, `.mkv`, alongside `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.svg`.
- **In-Browser Video Playback & Previews:** Video thumbnails with hover preview and play indicators in the grid, and a full-featured video player in the lightbox viewer with play/pause, seek, volume, and fullscreen controls.
- **Zero Cloud & Zero Uploads:** 100% client-side. No Node.js backend, Express, Python, PHP, Firebase, or Supabase.
- **Master Passcode Protection:** Secured by the browser's native Web Crypto API (SHA-256 with cryptographic salt), session lifecycle locking, and configurable inactivity auto-lock.

---

## 2. Where to Put Images and Videos Permanently

### Option A: Place files into `src/photos/`
Simply place your images and videos directly into the `src/photos/` folder:
```text
src/photos/
├── sample_timelapse.mp4
├── tropical_beach.svg
├── mountain_aurora.svg
├── city_sunset.svg
└── celebration_fireworks.svg
```
They are automatically bundled into your gallery without having to write any code or manual arrays!

### Option B: Use "Add Media" or Drag & Drop in the Web App
1. Open the website and enter your master password (default: `zish2026`).
2. Click the **"+ Add Media"** button in the top bar, or drag and drop photos and videos directly onto the gallery window.
3. Media is saved permanently into your device's persistent browser database (IndexedDB) and remains accessible across browser reloads, restarts, and sessions!

---

## 3. How to Run It

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm run dev
```

Visit `http://localhost:3000`. Default password is `zish2026`.
