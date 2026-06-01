// ==================== HELPER ====================
function sendMsg(msg) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch(e) {
    console.log("📵 sendMsg skipped (not in extension context):", msg);
  }
}

// ==================== DELETE CHATS ====================
let isDeleting = false;
let stopRequested = false;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteChats() {
  while (!stopRequested && isDeleting) {
    const deleteButtons = document.querySelectorAll('div[aria-label="Delete chat"], button[aria-label="Delete"]');
    
    if (deleteButtons.length === 0) {
      console.log("No more chats to delete");
      sendMsg({ action: "deleteComplete" });
      break;
    }
    
    deleteButtons[0].click();
    await wait(500);
    
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Delete')
    );
    
    if (confirmBtn) {
      confirmBtn.click();
      await wait(800);
    }
  }
  isDeleting = false;
}

function startDeleting() {
  if (isDeleting) return;
  isDeleting = true;
  stopRequested = false;
  deleteChats();
}

function stopDeleting() {
  stopRequested = true;
  isDeleting = false;
}

// ==================== DELETE PHOTOS FROM STORY ARCHIVES ====================
let isDeletingPhotos = false;
let deleteCount = 0;

async function deletePhotosLoop() {
  console.log("🟢 deletePhotosLoop() started");

  while (isDeletingPhotos) {
    console.log("🔁 Loop tick — looking for Menu button...");

    // STEP 1: Click menu button
    const menuBtn = document.querySelector('div[aria-label="Menu"][role="button"]');
    console.log("🔍 menuBtn result:", menuBtn);

    if (!menuBtn) {
      console.log(`✅ No menu button found — done! Deleted ${deleteCount} photos`);
      sendMsg({ action: "photoDeleteComplete", message: `Deleted ${deleteCount} photos` });
      isDeletingPhotos = false;
      break;
    }

    menuBtn.click();
    console.log("✅ STEP 1: Menu button clicked");
    await wait(1000);

    // STEP 2: Click "Delete photo"
    const allDivs = document.querySelectorAll('div');
    console.log(`🔍 STEP 2: Scanning ${allDivs.length} divs for 'Delete photo'...`);
    const deletePhoto = Array.from(allDivs).find(el => el.innerText === 'Delete photo');
    console.log("🔍 deletePhoto result:", deletePhoto);

    if (deletePhoto) {
      deletePhoto.click();
      console.log("✅ STEP 2: Delete photo clicked");
    } else {
      console.log("❌ STEP 2: 'Delete photo' not found — closing menu and retrying");
      document.body.click();
      await wait(800);
      continue;
    }
    await wait(1000);

    // STEP 3: Confirm deletion
    const allBtns = document.querySelectorAll('div[role="button"]');
    console.log(`🔍 STEP 3: Scanning ${allBtns.length} role=button divs for 'Delete'...`);
    const confirmBtn = Array.from(allBtns).find(el => el.innerText === 'Delete');
    console.log("🔍 confirmBtn result:", confirmBtn);

    if (confirmBtn) {
      confirmBtn.click();
      deleteCount++;
      console.log(`✅ STEP 3: Confirmed! Total deleted: ${deleteCount}`);
      sendMsg({ status: `Deleted ${deleteCount} photos...` });
    } else {
      console.log("❌ STEP 3: Confirm 'Delete' button not found");
    }

    await wait(2000);
  }

  console.log("🔴 deletePhotosLoop() exited");
}

function startPhotoDeletion() {
  console.log("📣 startPhotoDeletion() called, isDeletingPhotos =", isDeletingPhotos);
  if (isDeletingPhotos) {
    console.log("⚠️ Already running, ignoring");
    return;
  }
  isDeletingPhotos = true;
  deleteCount = 0;
  console.log("🚀 Starting photo deletion loop...");
  sendMsg({ status: "Deleting story photos..." });
  deletePhotosLoop();
}

function stopPhotoDeletion() {
  console.log("🛑 stopPhotoDeletion() called");
  isDeletingPhotos = false;
  console.log(`⏹️ Stopped. Total deleted: ${deleteCount}`);
  sendMsg({ action: "photoDeleteStopped", message: `Deleted ${deleteCount} photos` });
}

// ==================== MESSAGE HANDLER ====================
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received:", request.action);
    
    if (request.action === "start") {
      startDeleting();
      sendResponse({ success: true });
    } 
    else if (request.action === "stop") {
      stopDeleting();
      sendResponse({ success: true });
    }
    else if (request.action === "startDeletePhotos") {
      console.log("📩 Routing to startPhotoDeletion()");
      startPhotoDeletion();
      sendResponse({ success: true });
    }
    else if (request.action === "stopDeletePhotos") {
      stopPhotoDeletion();
      sendResponse({ success: true });
    }
    
    return true;
  });
  console.log("✅ Content script loaded and ready!");
} catch(e) {
  console.log("⚠️ Not running as extension — calling startPhotoDeletion() directly for testing");
  startPhotoDeletion();
}