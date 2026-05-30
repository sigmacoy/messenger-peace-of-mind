// content.js - Messenger Chat Deletor (Skips Marketplace)
console.log("Messenger deleter loaded");

const SCROLL_DELAY = 1500;
const CLICK_DELAY = 500;
const MENU_DELAY = 300;

// Check if a chat is Marketplace (no menu button available)
function isMarketplaceChat(chatRow) {
  // Check for Marketplace indicators
  const text = chatRow.innerText || '';
  
  const marketplaceIndicators = [
    'Marketplace',
    'marketplace',
    'Listing',
    'Buying',
    'Selling',
    'Shipping',
    'Item sold',
    'Your listing'
  ];
  
  for (let indicator of marketplaceIndicators) {
    if (text.includes(indicator)) {
      console.log('⏭️ Skipping Marketplace chat:', text.substring(0, 50));
      return true;
    }
  }
  
  // Check for specific Marketplace class/attribute patterns
  const hasMarketplaceClass = chatRow.querySelector('[class*="marketplace"], [aria-label*="marketplace"]');
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
    if (btn && btn.offsetParent !== null) { // Check if visible
      return true;
    }
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
    if (btn && btn.offsetParent !== null) {
      return btn;
    }
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
  
  // Filter out Marketplace chats and duplicates
  const uniqueRows = [...new Map(allRows.map(row => [row, row])).values()];
  const validRows = uniqueRows.filter(row => {
    if (isMarketplaceChat(row)) return false;
    if (!hasMenuButton(row)) {
      console.log('⏭️ Skipping chat without menu button');
      return false;
    }
    return true;
  });
  
  return validRows;
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

// Confirm deletion dialog
function confirmDelete() {
  const buttons = document.querySelectorAll('button, div[role="button"]');
  for (let btn of buttons) {
    const text = btn.innerText || '';
    if (text === 'Delete' || text === 'Delete chat' || text.includes('Delete')) {
      if (btn.offsetParent !== null) { // Visible button
        return btn;
      }
    }
  }
  return null;
}

// Delete a single chat
async function deleteChat(chatRow, index) {
  console.log(`Processing chat ${index + 1}...`);
  
  // Extra check before proceeding
  if (isMarketplaceChat(chatRow)) {
    console.log('❌ Marketplace detected - skipping');
    return { success: false, skipped: true, reason: 'marketplace' };
  }
  
  // 1. Scroll to make sure it's visible
  chatRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(300);
  
  // 2. Hover to reveal menu button
  chatRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  chatRow.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  await delay(500);
  
  // 3. Find and click the "..." button
  const menuBtn = findMenuButton(chatRow);
  if (!menuBtn) {
    console.log("⚠️ No menu button found - skipping");
    return { success: false, skipped: true, reason: 'no_menu' };
  }
  
  menuBtn.click();
  await delay(MENU_DELAY);
  
  // 4. Find and click Delete chat
  const deleteOption = findDeleteOption();
  if (!deleteOption) {
    console.log("⚠️ Delete option not found");
    document.body.click(); // Close menu
    return { success: false, skipped: false, reason: 'no_delete' };
  }
  
  deleteOption.click();
  await delay(CLICK_DELAY);
  
  // 5. Confirm deletion
  const confirmBtn = confirmDelete();
  if (confirmBtn) {
    confirmBtn.click();
    await delay(CLICK_DELAY);
    console.log(`✅ Deleted chat ${index + 1}`);
    return { success: true, skipped: false };
  }
  
  return { success: false, skipped: false, reason: 'no_confirm' };
}

// Main deletion loop
async function deleteAllChats() {
  console.log("🚀 Starting Messenger chat deletion...");
  console.log("⚠️ Marketplace chats will be automatically skipped");
  
  let deletedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let maxIterations = 50;
  let iteration = 0;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Get valid chat rows (Marketplace already filtered out)
    const chats = getValidChatRows();
    
    if (chats.length === 0) {
      console.log("📭 No more valid chats found");
      break;
    }
    
    console.log(`\n📊 Round ${iteration}: Found ${chats.length} valid chats`);
    
    // Try to delete the first valid chat
    const result = await deleteChat(chats[0], deletedCount);
    
    if (result.success) {
      deletedCount++;
      await delay(SCROLL_DELAY);
    } else if (result.skipped) {
      skippedCount++;
      // Force remove this chat from DOM by scrolling past it
      chats[0].style.display = 'none'; // Hide it so we don't get stuck
      window.scrollBy(0, 100);
      await delay(500);
    } else {
      failedCount++;
      await delay(1000);
    }
    
    // Stop conditions
    if (failedCount > 15) {
      console.log("🛑 Too many failures, stopping");
      break;
    }
    
    // Refresh view to load more chats
    if (iteration % 5 === 0) {
      window.scrollTo(0, document.body.scrollHeight);
      await delay(2000);
    }
  }
  
  console.log(`\n🎉 COMPLETE!`);
  console.log(`✅ Deleted: ${deletedCount}`);
  console.log(`⏭️ Skipped (Marketplace/etc): ${skippedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  
  alert(`✅ Deleted ${deletedCount} chats\n⏭️ Skipped ${skippedCount} (Marketplace)\n❌ Failed ${failedCount}`);
}

// Helper delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for popup message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    deleteAllChats().catch(console.error);
    sendResponse({status: "started"});
  }
});

// Optional: Auto-start (uncomment if you want)
// setTimeout(() => deleteAllChats(), 2000);