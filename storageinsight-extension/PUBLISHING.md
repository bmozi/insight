# Publishing StorageInsight to Chrome Web Store

This guide outlines the steps to package and publish the StorageInsight extension to the Chrome Web Store.

## Prerequisites

- A Google Account.
- A [Chrome Web Store Developer Account](https://chrome.google.com/webstore/developer/dashboard) (requires a one-time $5 fee).
- Node.js installed on your machine (for the packaging script).

## 1. Prepare the Codebase

Before packaging, ensure the extension is ready for release:

1.  **Update Version**: Open `manifest.json` and increment the `version` field (e.g., `1.0.0` -> `1.0.1`).
    ```json
    {
      "version": "1.0.1",
      ...
    }
    ```
2.  **Clean Up**: Remove any `console.log` statements or debug code used during development.
3.  **Test**: Perform a final round of testing by loading the unpacked extension in Chrome and verifying all features.

## 2. Package the Extension

We have a script to automate the packaging process. This script creates a clean zip file ready for upload.

1.  Open your terminal in the project root.
2.  Run the packaging script:
    ```bash
    node storageinsight-extension/scripts/package.js
    ```
3.  The script will generate a zip file in the `storageinsight-extension/dist/` directory, named `storageinsight-extension-vX.Y.Z.zip`.

## 3. Upload to Chrome Web Store

1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  Click the **"New Item"** button (or select an existing item to update).
3.  Upload the zip file generated in the previous step (`storageinsight-extension/dist/storageinsight-extension-vX.Y.Z.zip`).
4.  Fill in the store listing details:
    -   **Description**: A clear and concise description of the extension.
    -   **Screenshots**: Upload at least one screenshot (1280x800 or 640x400).
    -   **Promotional Tile**: (Optional but recommended) 440x280 image.
    -   **Category**: Select "Privacy" or "Developer Tools".
5.  **Privacy Practices**:
    -   Complete the privacy tab.
    -   Disclose that the extension collects "Web History" (for storage scanning) and "Cookies".
    -   Confirm that data is not sold to third parties and is not used for unrelated purposes.
6.  **Submit for Review**: Click the "Submit for Review" button.

## 4. Handling Updates

To release an update:

1.  Increment the `version` in `manifest.json`.
2.  Run the packaging script again.
3.  Go to the Developer Dashboard, select the extension, and click **"Package"** > **"Upload new package"**.
4.  Submit the update for review.

## Troubleshooting

-   **"Manifest is not valid"**: Ensure `manifest.json` is valid JSON and contains all required fields.
-   **"Icon missing"**: Ensure all icons specified in `manifest.json` exist in the `assets/icons` directory.
-   **Zip file too large**: Ensure you are not including `node_modules` or other unnecessary files (the script handles this automatically).
