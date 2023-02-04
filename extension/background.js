chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addMark",
    title: "マークを追加",
    contexts: ["all"]
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { message: "addMark" });
});

chrome.contextMenus.onClicked.addListener((menu, tab) => {
  if (menu.menuItemId == "addMark") {
    chrome.tabs.sendMessage(tab.id, { message: "addMark" });
  }
});