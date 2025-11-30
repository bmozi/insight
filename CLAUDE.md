# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insight is a privacy-focused browser storage dashboard with two components:
1. **Next.js Web App** - Dashboard displaying storage metrics and privacy analysis
2. **Chrome Extension** (in `storageinsight-extension/`) - Scans browser storage and communicates with the web app

## Common Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

### Web App (Next.js 16 + React 19)

- **`app/page.tsx`** - Main dashboard component (client-side rendered). Displays metrics cards, storage usage pie chart, privacy recommendations, and high-risk items. Uses `useExtensionData` hook for extension communication.

- **`lib/useExtensionData.ts`** - React hook managing extension communication via `window.postMessage`. Persists scan data to IndexedDB and handles message types: `SCAN_DATA`, `SYNC_UPDATE`, `EXTENSION_READY`.

- **`lib/storage-db.ts`** - IndexedDB wrapper using `idb` library. Stores scan history (keeps last 30 scans) and settings.

- **`lib/privacy-analyzer-web.ts`** - Privacy scoring algorithm. Categorizes cookies (analytics, advertising, social, fingerprinting) and calculates score with deductions:
  - -2 per tracking cookie
  - -3 per advertising cookie
  - -5 per fingerprinting cookie
  - -1 per long-lived cookie (>1 year)
  - -2 per insecure cookie on sensitive domains
  - -1 per 100KB localStorage

### Chrome Extension (Manifest V3)

- **`background/service-worker.js`** - Background service worker
- **`content/content-script.js`** - Content script injected on all pages
- **`lib/storage-scanner.js`** - Scans cookies, localStorage, sessionStorage, IndexedDB
- **`lib/privacy-analyzer.js`** - Extension version of privacy analysis
- **`lib/tracking-database.js`** - Known tracker patterns database
- **`popup/`** - Extension popup UI
- **`options/`** - Extension settings page

### Communication Flow

1. Extension scans browser storage
2. Content script posts message with `source: 'storageinsight-extension'`
3. Web app's `useExtensionData` hook receives via `window.addEventListener('message', ...)`
4. Web app can request data via `source: 'insight-webapp', type: 'REQUEST_DATA'`

## Key Technologies

- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Recharts for visualization
- `idb` for IndexedDB
- lucide-react for icons

## Path Aliases

`@/*` maps to project root (configured in tsconfig.json)
