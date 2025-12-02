const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(EXTENSION_DIR, 'dist');
const MANIFEST_PATH = path.join(EXTENSION_DIR, 'manifest.json');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// Read version from manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const version = manifest.version;
const zipName = `storageinsight-extension-v${version}.zip`;
const zipPath = path.join(DIST_DIR, zipName);

console.log(`📦 Packaging StorageInsight Extension v${version}...`);

// Files and directories to include
const includeList = [
    'manifest.json',
    'background',
    'content',
    'popup',
    'options',
    'lib',
    'assets',
    'styles'
];

// Create a temporary directory for staging
const stagingDir = path.join(DIST_DIR, 'staging');
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir);

// Copy files to staging
console.log('📂 Copying files...');
includeList.forEach(item => {
    const src = path.join(EXTENSION_DIR, item);
    const dest = path.join(stagingDir, item);

    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
    } else {
        console.warn(`⚠️ Warning: ${item} not found.`);
    }
});

// Create zip file
console.log('🤐 Zipping...');
try {
    // Using zip command if available (macOS/Linux)
    execSync(`cd "${stagingDir}" && zip -r "${zipPath}" .`);
    console.log(`✅ Successfully created: ${zipPath}`);
} catch (error) {
    console.error('❌ Error creating zip file:', error.message);
    console.log('ℹ️  Ensure you have the "zip" command installed.');
}

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });
