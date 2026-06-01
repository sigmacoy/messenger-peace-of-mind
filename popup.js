const status = document.getElementById("status");
const mainView = document.getElementById("mainView");
const qrView = document.getElementById("qrView");

function sendAction(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action });
    } else {
      setStatus("❌ No active tab", 'error');
    }
  });
}

function setStatus(msg, type = 'info') {
  status.textContent = msg;
  status.className = '';
  if (type === 'deleting') status.classList.add('status-deleting');
  else if (type === 'success') status.classList.add('status-success');
  else if (type === 'error') status.classList.add('status-error');
  else if (type === 'stopped') status.classList.add('status-stopped');
}

document.getElementById("deleteBtn").addEventListener("click", () => {
  sendAction("start");
  setStatus("🗑️ Deleting chats...", 'deleting');
});

document.getElementById("stopDeleteBtn").addEventListener("click", () => {
  sendAction("stop");
  setStatus("⏹️ Chat deletion stopped", 'stopped');
});

document.getElementById("deletePhotosBtn").addEventListener("click", () => {
  sendAction("startDeletePhotos");
  setStatus("📸 Deleting story photos...", 'deleting');
});

document.getElementById("stopPhotosBtn").addEventListener("click", () => {
  sendAction("stopDeletePhotos");
  setStatus("⏹️ Photo deletion stopped", 'stopped');
});

document.getElementById("coffeeBtn").addEventListener("click", () => {
  mainView.style.display = "none";
  qrView.style.display = "flex";
});

document.getElementById("backBtn").addEventListener("click", () => {
  qrView.style.display = "none";
  mainView.style.display = "block";
});

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.status) {
    setStatus(request.status, 'deleting');
  }
  if (request.action === "deleteComplete") {
    setStatus("✅ Chat deletion complete", 'success');
  }
  if (request.action === "photoDeleteComplete") {
    setStatus(`✅ ${request.message}`, 'success');
  }
  if (request.action === "photoDeleteStopped") {
    setStatus(`⏹️ ${request.message}`, 'stopped');
  }
});