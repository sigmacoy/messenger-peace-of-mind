// content.js - Messenger Chat Deletor (Skips Marketplace)
console.log("Messenger deleter loaded");

const SCROLL_DELAY = 1500;
const CLICK_DELAY = 500;
const MENU_DELAY = 300;
const NUM_CHATS_DELETE = 10000;

// Helper delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a chat is Marketplace (no menu button available)
function isMarketplaceChat(chatRow) {
  const text = chatRow.innerText || '';

  const marketplaceIndicators = [
    'Marketplace', 'marketplace', 'Listing',
    'Buying', 'Selling', 'Shipping', 'Item sold', 'Your listing'
  ];

  for (let indicator of marketplaceIndicators) {
    if (text.includes(indicator)) {
      console.log('⏭Skipping Marketplace chat:', text.substring(0, 50));
      return true;
    }
  }

  const hasMarketplaceClass = chatRow.querySelector(
    '[class*="marketplace"], [aria-label*="marketplace"]'
  );
  if (hasMarketplaceClass) return true;

  return false;
}

// Check if chat has a menu button (Marketplace doesn't)
function hasMenuButton(chatRow) {
  const selectors = [
    '[aria-label*="More options"]',
    '[aria-label*="Actions"]',
    'div[role="button"][aria-label]',
    'svg[aria-label*="more"]'
  ];

  for (let sel of selectors) {
    const btn = chatRow.querySelector(sel);
    if (btn && btn.offsetParent !== null) return true;
  }
  return false;
}

// Find the "..." button on a chat row
function findMenuButton(chatRow) {
  const selectors = [
    '[aria-label*="More options"]',
    '[aria-label*="Actions"]',
    'div[role="button"][aria-label]',
    'svg[aria-label*="more"]',
    'div[aria-label*="Menu"]',
    'div[role="button"]:last-child'
  ];

  for (let sel of selectors) {
    const btn = chatRow.querySelector(sel);
    if (btn && btn.offsetParent !== null) return btn;
  }
  return null;
}

// Find all valid (non-Marketplace) chat rows
function getValidChatRows() {
  const selectors = [
    '[role="row"]',
    'div[role="button"][aria-label*="chat"]',
    '.x1n2onr6.xdj266r',
    'div[aria-label*="Chat list"] div[role="button"]'
  ];

  let allRows = [];
  for (let sel of selectors) {
    const rows = document.querySelectorAll(sel);
    if (rows.length > 0) {
      allRows = [...allRows, ...rows];
      break;
    }
  }

  const uniqueRows = [...new Map(allRows.map(row => [row, row])).values()];
  return uniqueRows.filter(row => {
    if (isMarketplaceChat(row)) return false;
    if (!hasMenuButton(row)) {
      console.log('⏭️ Skipping chat without menu button');
      return false;
    }
    return true;
  });
}

// Find the Delete chat option in the open menu
function findDeleteOption() {
  // Try the labelled menu first
  const menu = document.querySelector(
    'div[role="menu"][aria-label="More options for this chat"]'
  );

  // Fallback: any visible menu
  const target = menu || document.querySelector('div[role="menu"]');
  if (!target) return null;

  const items = target.querySelectorAll('div[role="menuitem"]');
  for (let item of items) {
    const span = item.querySelector('span[dir="auto"]');
    if (span && span.innerText.trim() === 'Delete chat') return item;
  }
  return null;
}

function findConfirmButton() {
  // Wait for the fully loaded dialog (not the "Loading..." state)
  const dialog = document.querySelector('[role="dialog"][aria-label="Delete chat"]');
  if (!dialog) return null;

  // Button 3: aria-label="Delete chat" AND has visible text "Delete chat"
  // (Button 1 also has aria-label="Delete chat" but no text — it's an icon/header)
  const buttons = dialog.querySelectorAll('[role="button"][aria-label="Delete chat"]');
  for (let btn of buttons) {
    if (btn.innerText?.trim() === 'Delete chat' && btn.offsetParent !== null) {
      console.log('Found confirm button:', btn.outerHTML.substring(0, 150));
      return btn;
    }
  }
  return null;
}

// Simulate a real mouse click (bypasses React's synthetic event checks)
function realClick(el) {
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true, view: window }));
}

// Delete a single chat — returns { success: boolean }
async function deleteChat(chatRow) {
  console.log(`🗑️ Attempting: ${chatRow.innerText.substring(0, 30)}...`);

  // 1. Scroll into view
  chatRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(300);

  // 2. Hover to reveal the "..." button
  chatRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await delay(500);

  // 3. Click the "..." menu button
  const menuBtn = findMenuButton(chatRow);
  if (!menuBtn) {
    console.log('⚠️ No menu button found, skipping');
    return { success: false };
  }
  realClick(menuBtn);
  await delay(MENU_DELAY + 200);

  // 4. Click "Delete chat" in the dropdown
  const deleteOption = findDeleteOption();
  if (!deleteOption) {
    console.log('⚠️ Delete option not found in menu');
    document.body.click(); // close the menu
    return { success: false };
  }
  realClick(deleteOption);
  console.log('✓ Delete option clicked, waiting for confirm dialog…');

  // 5. Wait for the FULLY LOADED confirm dialog (not just any dialog)
  let confirmBtn = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await delay(300);
    // Check dialog is fully loaded (aria-label changes from "Loading..." to "Delete chat")
    const dialog = document.querySelector('[role="dialog"][aria-label="Delete chat"]');
    if (dialog) {
      confirmBtn = findConfirmButton();
      if (confirmBtn) break;
    }
    console.log(`  …waiting for dialog to load (attempt ${attempt + 1})`);
  }

  if (!confirmBtn) {
    console.log('Confirm button never appeared');
    // Try pressing Escape to close any stuck overlay
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return { success: false };
  }

  // 6. Click the confirm "Delete chat" button
  realClick(confirmBtn);
  await delay(800);
  console.log('Chat deleted successfully');
  return { success: true };
}

// Main loop
async function deleteAllChats() {
  console.log('Starting Messenger chat deletion…');
  let deletedCount = 0;

  for (let i = 0; i < NUM_CHATS_DELETE; i++) {
    const allChats = document.querySelectorAll('[role="row"]');

    let chatToDelete = null;
    for (let chat of allChats) {
      if (!isMarketplaceChat(chat)) {
        chatToDelete = chat;
        break;
      }
    }

    if (!chatToDelete) {
      console.log('No more non-Marketplace chats found');
      break;
    }

    const result = await deleteChat(chatToDelete);

    if (result.success) {
      deletedCount++;
      console.log(`Total deleted: ${deletedCount}`);
    } else {
      // Hide so we don't retry the same stuck chat forever
      chatToDelete.style.display = 'none';
    }

    await delay(1500);
  }

  alert(`Finished! Deleted ${deletedCount} chats.`);
}

// Listen for popup trigger
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    deleteAllChats().catch(console.error);
    sendResponse({ status: 'started' });
  }
});