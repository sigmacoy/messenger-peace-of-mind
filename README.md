# Messenger Chat Deletor

### A Chrome extension that bulk-deletes or redacts Messenger chats. Marketplace conversations are automatically skipped.
### Redacts - unsend all your messages in that chat.



## Features

- Deletes non-Marketplace chats one by one without manual interaction
- Stop button halts the current operation at any time
- Redact Chats button (stub — wire up your redact logic in content.js)
- Skips chats that have no menu button or are identified as Marketplace listings

## IMPORTANT NOTE: Facebook Rate Limiting

This script automatically stops or causes page refresh after deleting **30-50 chats** due to Facebook's anti-bot protection. 

**But hey, at least you didn't pay anything. No money spent.**
**Free = No complaints. Just re-run and keep deleting.**




## Installation
1. Clone or download this repository and unzip it if needed.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. The extension icon will appear in your toolbar. Pin it if needed.
6. Navigate to [facebook.com/messages](https://www.facebook.com/messages/t/) and wait for the page to fully load.
7. Click the extension icon to open the popup and press **Delete Chats** to begin. (Please do archive the conversations you don't want to get deleted.)



## Stopping

Click the red square button next to **Delete Chats** or **Redact Chats** at any time to stop the current operation. The extension sends a `stop` or `stopRedact` message to the content script — make sure your `content.js` listens for those actions.



## Notes

- The extension relies on Facebook's DOM structure, which can change without notice. If it stops working, re-run the debug snippets in the console to find updated selectors.
- Do not close or navigate away from Messenger while a deletion run is in progress.
- Deleted chats cannot be recovered.