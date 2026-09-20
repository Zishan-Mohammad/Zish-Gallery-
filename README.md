# Zish-Gallery: Private Password-Protected Photo Vault (Client-Side Only)

> **Important Security & Privacy Disclaimer**  
> **"This application provides client-side privacy features only. It does not provide server-side access control. Anyone who has access to the selected local folder or application source can potentially bypass client-side protection."**  
> Zish-Gallery is designed exclusively for personal and local privacy convenience. It does not advertise military-grade, server-grade, or tamper-proof encryption.

---

## 1. What the Application Does

**Zish-Gallery** is a 100% frontend, private photo gallery web application where your images are permanently and securely accessible without requiring any folder selection dialogs or cloud uploads.

- **Zero Folder Prompts:** Open the site, enter your password, and your private photo gallery opens immediately.
- **Permanent Local Storage:** Photos placed in the project's permanent `src/photos/` folder or added via the **"Add Photos"** / drag-and-drop tool are permanently saved locally on your device in persistent browser storage (IndexedDB).
- **100% Client-Side & Zero Cloud:** No Node.js backend, Express, Python, PHP, Firebase, or Supabase. Everything runs entirely within the browser.
- **Master Password Protection:** Secured by the browser's native Web Crypto API (SHA-256 with cryptographic salt), session lifecycle locking, and configurable inactivity auto-lock.
- **Modern Responsive Gallery:** Density modes (Compact, Comfortable, Large), fullscreen lightbox with zoom, instant search, format filters, favorites, and keyboard/touch navigation.

---

## 2. Where to Put Images Permanently

You have two easy ways to keep your photos in the vault permanently:

### Option A: Place files into `src/photos/` (in the project codebase)
Simply drop any `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, or `.svg` files into the `src/photos/` folder:
```text
src/photos/
├── vacation.jpg
├── beach.png
├── birthday.webp
├── Family/
│   ├── celebration.jpg
│   └── portrait.png
└── Vacation/
    ├── resort.jpg
    └── tropical_beach.svg
```
Vite will automatically detect and bundle them into your gallery without having to write any code or manual arrays!

### Option B: Use "Add Photos" or Drag & Drop in the Web App
1. Open the website and enter your master password (default: `zish2026`).
2. Click the **"+ Add Photos"** button in the top bar, or simply drag and drop your photos directly onto the gallery window.
3. The photos are permanently saved into your device's persistent browser database (IndexedDB) and remain accessible across browser restarts and reloads!

---

## 3. How to Run It

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm run dev
```

Visit `http://localhost:3000`.

---

## 4. How Password Protection Works

- **Passcode Hashing:** Passwords are never saved in plaintext; they are salted and hashed using `crypto.subtle.digest('SHA-256')`.
- **Default Master Password:** `zish2026`
- **Changing Master Password:** Open **Settings** (gear icon) in the header. Enter your current password and your new password to update the vault key.
- **Auto-Lock on Inactivity:** The gallery automatically locks itself if no user interaction is detected for the duration set in Settings (default: 15 minutes).
- **Session Scoping:** When you close your browser tab or click **Lock**, the session token is removed from `sessionStorage`.

---

## 5. Privacy Limitations & Security Notice

- **No Remote Transmission:** Your photos and passwords are never transmitted over the internet or sent to any remote server.
- **Device Access:** Anyone who has physical login access to your computer or device storage can view files in the local filesystem.
- **Static Hosting:** Because there is no backend, you can deploy the generated static `dist/` build anywhere (GitHub Pages, Cloudflare Pages, Netlify, Vercel).
