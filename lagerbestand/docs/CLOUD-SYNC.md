# Cloud Sync Feature

## Overview

The warehouse system now supports cloud synchronization for cross-device data access. This feature allows you to back up your data to cloud services and restore it on any device.

## Location

All sync features are located in the dedicated **Sync** tab, which includes:
- Cloud synchronization settings and controls
- Cross-tab real-time sync status
- Sync activity log
- Local backup options
- IndexedDB status
- Data statistics

## Cross-Tab/Cross-Device Synchronization

### How It Works

1. **Same Browser (Multiple Tabs)**:
   - Uses BroadcastChannel API for instant synchronization
   - Changes in one tab appear immediately in all other tabs
   - No cloud connection required for tab-to-tab sync

2. **Different Devices**:
   - Requires cloud sync to be configured (GitHub Gist or Local Server)
   - Upload changes to cloud from Device A
   - Download changes from cloud on Device B
   - Auto-sync can keep devices in sync automatically

### Conflict Resolution

When the same data is modified on multiple devices:
- The most recent change (by timestamp) wins
- Sync log tracks all operations for audit purposes

## Available Providers

### 1. GitHub Gist

Store your warehouse data as a private or public GitHub Gist.

**Setup:**
1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Generate a new token with the `gist` scope
3. In the app, go to the **Sync** tab and click **Settings**
4. Select "GitHub Gist" as provider
5. Paste your token
6. (Optional) Enter an existing Gist ID, or leave empty to create a new one
7. Click Save

**Features:**
- Automatic gist creation on first sync
- Choose between public or private gists
- Configurable backup filename

### 2. Local/Custom Server

Sync to your own server endpoint (useful for self-hosted solutions, enterprise environments, or local network sync).

**Setup:**
1. In the app, go to the **Sync** tab and click **Settings**
2. Select "Local Server" as provider
3. Enter your upload URL (POST endpoint)
4. Enter your download URL (GET endpoint)
5. (Optional) Add authentication headers
6. Click Save

**Supported Endpoints:**
- Any HTTPS endpoint (e.g., `https://your-server.com/api/backup`)
- Local development servers: `http://localhost:*` and `http://127.0.0.1:*`
- Same-origin endpoints

> **Note:** HTTP endpoints (except localhost) are blocked by the Content Security Policy for security reasons. Always use HTTPS for production servers.

**Server Requirements:**
- Upload endpoint: Accept POST with JSON body, return JSON or 204 No Content
- Download endpoint: Return JSON backup data
- CORS headers required if serving from a different domain:
  ```
  Access-Control-Allow-Origin: <your-app-origin>
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

**Example Server Response Format:**
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-01T12:00:00.000Z",
  "appName": "Warehouse Early Warning System",
  "data": {
    "materials": { ... },
    "archive": [ ... ],
    "groups": { ... },
    "notes": { ... },
    "alertRules": { ... },
    "storageTypeSettings": { ... }
  },
  "metadata": {
    "materialCount": 100,
    "archiveCount": 50,
    "groupCount": 5,
    "noteCount": 10
  }
}
```

## Usage

### Manual Sync

1. **Upload**: Click "Upload Now" to push local data to the cloud
2. **Download**: Click "Download Now" to pull cloud data (overwrites local data)
3. **Test**: Click "Test Connection" to verify your configuration

### Auto-Sync

Enable automatic synchronization in settings:
1. Check "Automatic synchronization"
2. Set the interval (5 minutes to 24 hours)
3. Data will be automatically uploaded at the specified interval

### Cross-Tab Sync

No configuration needed! Changes automatically sync between tabs:
- Open the app in multiple browser tabs
- Make changes in one tab
- See the changes appear automatically in other tabs
- Toast notification indicates "Data updated from another tab"

## Security Considerations

⚠️ **Important Security Notes:**

1. **Token Storage**: Your authentication tokens are stored in the browser's localStorage. Only use this feature on trusted devices.

2. **GitHub Tokens**: Use a token with minimal permissions (only `gist` scope required).

3. **Private Gists**: Even "private" gists can be accessed by anyone with the URL. Don't rely on this for sensitive data.

4. **HTTPS**: Always use HTTPS URLs for your custom server endpoints.

5. **Network Security**: When using local server sync on public networks, ensure proper encryption.

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Check that your GitHub token is valid and has the `gist` scope
- For local server, verify your authentication headers

**"Cannot reach server"**
- Check your internet connection
- Verify the server URL is correct
- Check for CORS issues (browser console)

**"Invalid backup format"**
- The downloaded data doesn't match the expected format
- Check that the server returns proper JSON

**"Sync already in progress"**
- Wait for the current sync to complete
- If stuck, refresh the page

### Reset Configuration

To clear all cloud sync settings:
1. Go to Settings modal
2. Select "Not configured" as provider
3. Uncheck "Enable cloud synchronization"
4. Click Save

Or clear via browser console:
```javascript
localStorage.removeItem('warehouse_cloud_sync_settings');
location.reload();
```

## API Reference

### CloudSyncManager Class

```javascript
// Initialize
const cloudSync = new CloudSyncManager(dataManager);

// Get/Set settings
const settings = cloudSync.getSettings();
cloudSync.updateSettings({ enabled: true, provider: 'github-gist' });

// Sync operations
await cloudSync.sync('upload');    // Push to cloud
await cloudSync.sync('download');  // Pull from cloud

// Test connection
await cloudSync.testConnection();

// Get status for UI
const status = cloudSync.getSyncStatus();
```
