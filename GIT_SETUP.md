# Git Installation & Setup Guide

## 🚀 Quick Solution: Install Git for Windows

### Step 1: Download Git
1. Go to: **https://git-scm.com/download/win**
2. Download the installer (it will auto-detect 64-bit or 32-bit)
3. Run the installer

### Step 2: Installation Settings (Recommended)
During installation, use these settings:
- ✅ **Use Git from the command line and also from 3rd-party software** (Recommended)
- ✅ **Use the OpenSSL library**
- ✅ **Checkout Windows-style, commit Unix-style line endings**
- ✅ **Use MinTTY (the default terminal of MSYS2)**
- ✅ **Enable file system caching**
- ✅ **Enable Git Credential Manager** (for GitHub authentication)

### Step 3: Verify Installation
After installation, **close and reopen PowerShell**, then run:
```powershell
git --version
```
You should see something like: `git version 2.x.x`

---

## 📦 Alternative: Install Git via Winget (Windows Package Manager)

If you have Windows 10/11 with winget:
```powershell
winget install Git.Git
```

---

## 🔄 After Installing Git

### 1. Configure Git (First Time Setup)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2. Initialize Repository
```powershell
cd ai-study-notes
git init
git add .
git commit -m "Initial commit - Ready for deployment"
```

### 3. Add GitHub Remote
```powershell
git branch -M main
git remote add origin https://github.com/thiyagu-sz/ai-notes.git
```

### 4. Push to GitHub
```powershell
git push -u origin main
```

---

## 🚀 Alternative Deployment Methods (Without Git CLI)

### Option 1: GitHub Desktop (GUI)
1. Download **GitHub Desktop**: https://desktop.github.com/
2. Install and sign in with GitHub
3. File → Add Local Repository
4. Select your `ai-study-notes` folder
5. Click "Publish repository" button

### Option 2: Vercel CLI (Direct Upload)
1. Install Vercel CLI:
   ```powershell
   npm install -g vercel
   ```
2. Login to Vercel:
   ```powershell
   vercel login
   ```
3. Deploy directly:
   ```powershell
   cd ai-study-notes
   vercel
   ```
4. Follow the prompts
5. Add environment variables in Vercel dashboard

### Option 3: Manual Upload via GitHub Web
1. Go to https://github.com/thiyagu-sz/ai-notes
2. Click "uploading an existing file"
3. Drag and drop your project folder
4. Commit directly from GitHub web interface

### Option 4: Use VS Code Git Integration
If you're using VS Code:
1. Install the "Git" extension (usually pre-installed)
2. Open Source Control panel (Ctrl+Shift+G)
3. Click "Initialize Repository"
4. Stage all files
5. Commit
6. Push to GitHub (it will prompt for GitHub login)

---

## 🔐 GitHub Authentication Setup

After installing Git, you'll need to authenticate with GitHub:

### Option 1: GitHub Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Give it `repo` scope
4. Use token as password when pushing

### Option 2: GitHub Credential Manager (Recommended)
- Git for Windows installer includes Git Credential Manager
- It will prompt you to sign in to GitHub when you first push
- Follow the browser authentication flow

---

## ✅ Quick Checklist

- [ ] Install Git from https://git-scm.com/download/win
- [ ] Restart PowerShell after installation
- [ ] Verify: `git --version`
- [ ] Configure Git: `git config --global user.name "Your Name"`
- [ ] Configure Git: `git config --global user.email "your@email.com"`
- [ ] Initialize repo: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Add remote: `git remote add origin https://github.com/thiyagu-sz/ai-notes.git`
- [ ] Push: `git push -u origin main`

---

## 🆘 Troubleshooting

### Git command not found after installation
- **Solution**: Close and reopen PowerShell/terminal
- Or restart your computer

### Authentication failed when pushing
- Use Personal Access Token instead of password
- Or use GitHub Desktop for easier authentication

### Permission denied errors
- Make sure you have write access to the repository
- Check repository URL is correct

---

## 📝 Recommended: Use GitHub Desktop

**Easiest option if you're new to Git:**
1. Install GitHub Desktop: https://desktop.github.com/
2. Sign in with GitHub
3. File → Add Local Repository → Select your folder
4. Commit and push with GUI - No command line needed!

---

**Next Steps After Git Setup:**
1. Push code to GitHub
2. Go to vercel.com
3. Import GitHub repository
4. Add environment variables
5. Deploy!
