# StorageInsight Extension Permissions

This document explains why each permission is required for StorageInsight to function properly.

## Required Permissions

### `cookies`
**Why needed:** Allows the extension to read all cookies stored in your browser across all websites. This is essential for:
- Counting total cookies
- Identifying tracking cookies
- Analyzing cookie attributes (httpOnly, secure, sameSite)
- Calculating storage usage

### `storage`
**Why needed:** Enables the extension to:
- Store user preferences and settings
- Cache scan results for performance
- Maintain historical data for privacy score trends
- Save whitelist/blacklist configurations

### `tabs`
**Why needed:** Required to:
- Get information about open tabs
- Identify which websites are currently active
- Associate storage data with specific domains
- Enable per-tab storage analysis

### `activeTab`
**Why needed:** Allows the extension to:
- Access the currently active tab's information
- Show storage data relevant to the current website
- Provide context-aware privacy insights

### `scripting`
**Why needed:** Enables the extension to:
- Inject content scripts to detect localStorage, sessionStorage, and IndexedDB usage
- Collect storage data from web pages securely
- Execute storage scanning operations

### `alarms`
**Why needed:** Used for:
- Scheduling periodic storage scans
- Automated privacy reports
- Background monitoring of storage changes
- Scheduled cleanup tasks

### `host_permissions: ["<all_urls>"]`
**Why needed:** Required to:
- Access cookies from all domains
- Scan storage across all websites you visit
- Provide comprehensive privacy analysis
- Enable cross-site tracking detection

## Privacy Statement

StorageInsight is designed with privacy in mind:
- All data analysis happens locally on your device
- No data is sent to external servers
- No tracking or telemetry is performed
- You have complete control over your data

## Data Collection

The extension collects:
- Cookie names, sizes, and attributes (NOT cookie values)
- Storage usage statistics
- Domain names where storage is used
- Privacy-related metadata

The extension does NOT collect:
- Cookie values or sensitive data
- Personal information
- Browsing history beyond storage analysis
- Any data for advertising purposes
