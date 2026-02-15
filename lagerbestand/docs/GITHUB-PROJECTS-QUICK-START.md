# GitHub Projects Quick Start Guide

> **5-Minute Setup** - Get started with cloud sync and collaboration

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Get Your GitHub Token (2 min)

1. Go to https://github.com/settings/tokens/new
2. Name it: `Warehouse App`
3. Check the box: ☑️ **project**
4. Click **Generate token**
5. **Copy the token** (you won't see it again!)

### Step 2: Create a GitHub Project (1 min)

1. Go to your GitHub profile
2. Click **Projects** tab → **New Project**
3. Choose any template or start blank
4. Note the **number** in the URL: `github.com/users/YOUR-NAME/projects/NUMBER`

### Step 3: Configure the App (2 min)

1. Open the Warehouse App
2. Go to **Settings** tab
3. Click **GitHub Projects** card
4. Fill in:
   - **Token**: Paste your token from Step 1
   - **Username**: Your GitHub username
   - **Project Number**: The number from Step 2
5. Click **Save & Connect**
6. Wait for green checkmark ✓

**Done!** Your data now syncs to GitHub Projects automatically.

---

## 🎯 Essential Features

### Automatic Sync
- Syncs every 30 seconds automatically
- See status: "Connected & Syncing" in green
- Manual sync: Click **Force Sync Now** button

### Conflict Resolution
If you see **"Resolve Conflicts"** button:
1. Click it to open the conflict viewer
2. For each conflict, choose:
   - **Use Local** - Keep your changes
   - **Use Remote** - Accept the other person's changes
   - **Auto Merge** - Use the newest version
3. Done!

### Switch Between Storage
- **IndexedDB (Dexie)**: Fast local storage
- **GitHub Projects**: Cloud storage with collaboration
- Switch anytime in Settings → Storage Backend

---

## 🔥 Quick Tips

1. **First sync takes longest** - Subsequent syncs are cached
2. **Check "Sync Statistics"** - Monitor pending changes & conflicts
3. **Works offline** - Changes queue and sync when online
4. **Export backups** - Use Local Backup for safety
5. **Team collaboration** - Everyone uses the same project number

---

## ❓ Troubleshooting

### "Connection Failed"
- ✓ Check token has `project` scope
- ✓ Verify project number is correct
- ✓ Make sure project isn't deleted

### "Rate Limit Exceeded"
- Wait 1 hour (GitHub limit: 5000 calls/hour)
- Or increase sync interval in settings

### Data Not Appearing
- Click **Force Sync Now**
- Check internet connection
- Verify you're using the same project number

---

## 📚 Need More Help?

- **Full Documentation**: [GITHUB-PROJECTS-INTEGRATION.md](GITHUB-PROJECTS-INTEGRATION.md)
- **Troubleshooting**: See the full guide for detailed solutions
- **API Reference**: Check the integration docs

---

**You're all set!** 🎉

Your warehouse data now syncs to the cloud automatically, and you can collaborate with your team in real-time.
