# Storage Architecture Guide

> **Clear explanation of storage options** - No more confusion!

---

## 📊 Storage Systems Overview

The Warehouse App has **three distinct storage systems**, each serving a different purpose:

```
┌─────────────────────────────────────────────────────────────┐
│                    WAREHOUSE APP DATA                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │   1️⃣  PRIMARY STORAGE (Database)      │
        │   Where ALL your data lives           │
        └───────────────────────────────────────┘
                    ↙              ↘
        ┌─────────────────┐    ┌─────────────────┐
        │  Local (Dexie)  │    │ Cloud (GitHub)  │
        │  Browser DB     │    │  Projects DB    │
        │  • Fast         │    │  • Collaborative│
        │  • Offline      │    │  • Multi-device │
        │  • Single user  │    │  • Team sync    │
        └─────────────────┘    └─────────────────┘
                    ↓                  ↓
        ┌────────────────────────────────────────┐
        │   2️⃣  BACKUP SYSTEMS (Optional)        │
        │   For safekeeping & migration          │
        └────────────────────────────────────────┘
                    ↙              ↘
        ┌─────────────────┐    ┌─────────────────┐
        │  Local Files    │    │  GitHub Gist    │
        │  JSON Export    │    │  Cloud Backup   │
        │  • Manual       │    │  • Automatic    │
        │  • Portable     │    │  • Simple       │
        └─────────────────┘    └─────────────────┘
                            ↓
        ┌────────────────────────────────────────┐
        │   3️⃣  LOCAL SYNC (Always Active)       │
        │   Between browser tabs                 │
        └────────────────────────────────────────┘
```

---

## 1️⃣ Primary Storage (Choose ONE)

### 🏠 Local (Browser) - IndexedDB via Dexie

**What it is:**
- A database stored **in your browser**
- Uses IndexedDB technology
- Managed by Dexie.js library

**Best for:**
- ✅ Single-device use
- ✅ Maximum speed
- ✅ Offline-first
- ✅ Privacy (data never leaves your device)
- ✅ No configuration needed

**Limitations:**
- ❌ Data only on this browser
- ❌ No team collaboration
- ❌ Browser clear = data loss (unless backed up)

**When to use:**
> "I work alone on one computer and want maximum speed."

---

### ☁️ Cloud (GitHub Projects)

**What it is:**
- A database stored **in GitHub's cloud**
- Uses GitHub Projects v2 as backend
- Real-time synchronization

**Best for:**
- ✅ Multi-device access
- ✅ Team collaboration
- ✅ Automatic backups
- ✅ Version control
- ✅ Access from anywhere

**Limitations:**
- ❌ Requires internet
- ❌ Needs GitHub account
- ❌ Setup required
- ❌ API rate limits (5000/hour)

**When to use:**
> "I work with a team or need access from multiple devices."

---

## 2️⃣ Backup Systems (Optional, Use Both!)

### 📁 Local File Backup

**What it is:**
- Export data as `.json` file
- Download to your computer
- Import later when needed

**Use for:**
- Creating manual backups
- Migrating between storage backends
- Sharing data with others
- Archiving old data

**How to use:**
1. Click **"Export Data"** → saves JSON file
2. Store file safely
3. Click **"Import Data"** → restore from file

---

### 🌐 GitHub Gist Backup

**What it is:**
- Automatic backup to GitHub Gist
- Like a cloud clipboard
- **NOT** a database (just backup/restore)

**Important:** 
- ⚠️ This is **NOT** the same as GitHub Projects!
- GitHub Gist = Simple backup (one file)
- GitHub Projects = Full database (structured data)

**Use for:**
- Automatic cloud backups
- Quick restore from cloud
- Emergency recovery

**How to use:**
1. Configure Gist settings
2. Click **"Upload to Gist"** → backup created
3. Click **"Download from Gist"** → restore data

---

## 3️⃣ Cross-Tab Sync (Always Active)

**What it is:**
- Automatic sync between browser tabs
- Works with both storage backends
- Uses BroadcastChannel API

**What it does:**
- Change in Tab 1 → instantly appears in Tab 2
- No configuration needed
- Always enabled

---

## 🎯 Common Scenarios

### Scenario 1: Solo User, One Computer
```
✅ Use: Local (Browser) storage
✅ Backup: Export JSON files weekly
❌ Skip: GitHub Projects, Gist
```

### Scenario 2: Team Collaboration
```
✅ Use: Cloud (GitHub Projects) storage
✅ Backup: Both JSON export and Gist
✅ Benefit: Real-time team sync
```

### Scenario 3: Multi-Device Personal Use
```
✅ Use: Cloud (GitHub Projects) storage
✅ Backup: JSON files monthly
✅ Benefit: Access from laptop + desktop
```

### Scenario 4: Migrating Storage
```
1. Current storage: Export JSON
2. Switch to new storage backend
3. Import JSON into new backend
✅ Data transferred!
```

---

## ❓ FAQ

### Q: Can I use both Local and GitHub Projects?
**A:** No, you choose ONE primary storage. But you can switch anytime and migrate data via export/import.

### Q: What's the difference between GitHub Gist and GitHub Projects?
**A:** 
- **GitHub Gist** = Simple backup file (like Dropbox for one file)
- **GitHub Projects** = Full database with sync (like Google Drive with live collaboration)

### Q: Will my data be lost if I switch storage?
**A:** Data stays in the old storage. Use Export/Import to transfer it to the new storage.

### Q: Can I use GitHub Projects without Gist backup?
**A:** Yes! They're independent. Gist is optional backup, Projects is your main database.

### Q: What happens if I clear browser data?
**A:**
- **Local storage**: Data lost (unless backed up)
- **GitHub Projects**: Data safe in cloud

### Q: Which storage is faster?
**A:** Local (Browser) is fastest since it's on your device. GitHub Projects needs internet but has auto-sync.

---

## 🚀 Quick Start Recommendations

### For Most Users (Start Here)
1. **Start with Local (Browser)** storage
2. Export JSON backup weekly
3. If you need multi-device later, switch to GitHub Projects and import your data

### For Teams
1. **Start with GitHub Projects** immediately
2. Configure once, share project number with team
3. Everyone uses the same project
4. Set up Gist backup as safety net

---

## 📊 Storage Comparison Table

| Feature | Local (Browser) | GitHub Projects | JSON Export | GitHub Gist |
|---------|----------------|-----------------|-------------|-------------|
| **Type** | Database | Database | Backup | Backup |
| **Speed** | ⚡ Fastest | 🌐 Fast | 💾 Manual | ☁️ Cloud |
| **Team Sync** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Multi-Device** | ❌ No | ✅ Yes | 📤 Manual | 📤 Manual |
| **Offline** | ✅ Yes | ⚠️ Partial | ✅ Yes | ❌ No |
| **Setup** | ✅ None | ⚙️ Required | ✅ None | ⚙️ Simple |
| **Cost** | 🆓 Free | 🆓 Free | 🆓 Free | 🆓 Free |
| **Data Loss Risk** | ⚠️ Medium | ✅ Low | ✅ Low | ✅ Low |
| **Real-time Sync** | ✅ Tabs only | ✅ All devices | ❌ No | ❌ No |

---

## 🔄 Migration Guide

### From Local → GitHub Projects

1. **Export your data:**
   - Settings → Backup & Export
   - Click "Export Data"
   - Save the JSON file

2. **Switch storage:**
   - Settings → Primary Storage
   - Click "Cloud (GitHub Projects)"
   - Configure GitHub credentials

3. **Import your data:**
   - Settings → Backup & Export
   - Click "Import Data"
   - Select your saved JSON file

**Done!** Your data is now in GitHub Projects.

### From GitHub Projects → Local

Same steps, just switch direction:
1. Export from GitHub Projects
2. Switch to Local storage
3. Import the data

---

## 💡 Pro Tips

1. **Always keep backups** - Export JSON monthly regardless of storage choice
2. **Test imports** - Import to test environment first before production
3. **Document team setup** - Share GitHub project number with team clearly
4. **Monitor rate limits** - GitHub Projects has 5000 API calls/hour
5. **Use Gist as safety net** - Even with GitHub Projects, set up Gist backup

---

## 🆘 Troubleshooting

### "I switched storage but my data is missing!"
→ Data doesn't auto-migrate. Export from old storage, import to new.

### "My team can't see my changes"
→ Ensure everyone uses the same GitHub project number.

### "GitHub Gist backup failed"
→ Check that you're using Gist settings, not Projects settings.

### "Which storage am I using?"
→ Look for the "Active" badge in Settings → Primary Storage

---

**Last Updated:** February 15, 2026  
**Version:** 3.0.0
