const status = document.getElementById("status");
const mainView = document.getElementById("mainView");
const qrView = document.getElementById("qrView");

function sendAction(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action });
  });
}

function setStatus(msg) {
  status.textContent = msg;
}

document.getElementById("deleteBtn").addEventListener("click", () => {
  sendAction("start");
  setStatus("Deleting chats...");
});

document.getElementById("stopDeleteBtn").addEventListener("click", () => {
  sendAction("stop");
  setStatus("Stopped.");
});

document.getElementById("redactBtn").addEventListener("click", () => {
  sendAction("redact");
  setStatus("Redacting chats...");
});

document.getElementById("stopRedactBtn").addEventListener("click", () => {
  sendAction("stopRedact");
  setStatus("Stopped.");
});

document.getElementById("coffeeBtn").addEventListener("click", () => {
  mainView.style.display = "none";
  qrView.style.display = "flex";
});

document.getElementById("backBtn").addEventListener("click", () => {
  qrView.style.display = "none";
  mainView.style.display = "block";
});