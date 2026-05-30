// content.js - Messenger Chat Deletor
console.log("Messenger deleter loaded");

// Configuration
const SCROLL_DELAY = 1500;
const CLICK_DELAY = 500;
const MENU_DELAY = 300;

// Find the "..." button on a chat row
function findMenuButton(chatRow) {
  // Try multiple selector patterns
  const selectors = [
    '[aria-label*="More options"]',
    '[aria-label*="Actions"]',
    'div[role="button"][aria-label]',
    'svg[aria-label*="more"]',
    'div[aria-label*="Menu"]'
  ];
  
  for (let sel of selectors) {
    const btn = chatRow.querySelector(sel);
    if (btn) return btn;
  }
  
  // Fallback: look for any button in the hover area
  return chatRow.querySelector('[role="button"]:last-child');
}

// Find all chat rows on the page
function getChatRows() {
  const selectors = [
    '[role="row"]',
    'div[role="button"][aria-label*="chat"]',
    '.x1n2onr6.xdj266r'  // Common Messenger class
  ];
  
  for (let sel of selectors) {
    const rows = document.querySelectorAll(sel);
    if (rows.length > 0) return rows;
  }
  return [];
}

// Find the Delete chat option in the open menu
function findDeleteOption() {
  const menu = document.querySelector('div[role="menu"][aria-label="More options for this chat"]');
  if (!menu) return null;
  
  const items = menu.querySelectorAll('div[role="menuitem"]');
  for (let item of items) {
    const span = item.querySelector('span[dir="auto"]');
    if (span && span.innerText === 'Delete chat') {
      return item;
    }
  }
  return null;
}

// Confirm deletion
function confirmDelete() {
  // Look for confirmation dialog
  const confirmSelectors = [
    'button[aria-label="Delete"]',
    'div[role="button"]:contains("Delete")',
    '[data-testid="confirm_button"]'
  ];
  
  // Find by text as fallback
  const buttons = document.querySelectorAll('button, div[role="button"]');
  for (let btn of buttons) {
    if (btn.innerText === 'Delete' || btn.innerText === 'Delete chat') {
      return btn;
    }
  }
  return null;
}

// Delete a single chat
async function deleteChat(chatRow, index) {
  console.log(`Processing chat ${index + 1}...`);
  
  // 1. Hover to reveal menu button
  chatRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await delay(500);
  
  // 2. Find and click the "..." button
  const menuBtn = findMenuButton(chatRow);
  if (!menuBtn) {
    console.log("Could not find menu button");
    return false;
  }
  
  menuBtn.click();
  await delay(MENU_DELAY);
  
  // 3. Find and click Delete chat
  const deleteOption = findDeleteOption();
  if (!deleteOption) {
    console.log("Delete option not found");
    // Close menu by clicking elsewhere
    document.body.click();
    return false;
  }
  
  deleteOption.click();
  await delay(CLICK_DELAY);
  
  // 4. Confirm deletion
  const confirmBtn = confirmDelete();
  if (confirmBtn) {
    confirmBtn.click();
    await delay(CLICK_DELAY);
    console.log(`✅ Deleted chat ${index + 1}`);
    return true;
  }
  
  return false;
}

// Main deletion loop
async function deleteAllChats() {
  console.log("🚀 Starting Messenger chat deletion...");
  let deletedCount = 0;
  let failedCount = 0;
  let maxAttempts = 100; // Safety limit
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Get current chat rows
    const chats = getChatRows();
    if (chats.length === 0) {
      console.log("No more chats found");
      break;
    }
    
    console.log(`Found ${chats.length} chats`);
    
    // Delete first chat (others shift up after deletion)
    const success = await deleteChat(chats[0], deletedCount);
    
    if (success) {
      deletedCount++;
      await delay(SCROLL_DELAY);
    } else {
      failedCount++;
      // Scroll down to load more or trigger different chats
      window.scrollBy(0, 300);
      await delay(1000);
    }
    
    // Stop if too many failures
    if (failedCount > 10) {
      console.log("Too many failures, stopping");
      break;
    }
  }
  
  console.log(`🎉 Complete! Deleted: ${deletedCount}, Failed: ${failedCount}`);
  alert(`Deleted ${deletedCount} chats!`);
}

// Helper delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    deleteAllChats().catch(console.error);
    sendResponse({status: "started"});
  }
});

// Auto-run? Uncomment if you want it to start automatically
// setTimeout(() => deleteAllChats(), 3000);