async function isBookmarked(url) {
  try {
    const res = await fetch("http://localhost:8000/bookmarks");
    if (!res.ok) return false;
    const bookmarks = await res.json();
    return bookmarks.some((bm) => bm.link === url);
  } catch (err) {
    console.error("북마크 확인 실패:", err);
    return false;
  }
}

function setIcon(tabId, state) {
  let path;
  if (state === true) path = "icon.png";                  // 북마크 있음
  else if (state === false) path = "icon_grey.png";       // 북마크 없음
  else if (state === "pending") path = "icon_orange.png"; // 북마크 추가 중
  else path = "icon_grey.png";

  chrome.action.setIcon({ path, tabId }, () => {
    if (chrome.runtime.lastError) {
      console.error("아이콘 변경 실패:", chrome.runtime.lastError.message);
    }
  });
}

// 아이콘 클릭 → 북마크 추가/체크
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const already = await isBookmarked(tab.url);

    if (already) {
      setIcon(tab.id, true);
      chrome.tabs.sendMessage(tab.id, { type: "BOOKMARK_ALREADY" });
      return;
    }

    setIcon(tab.id, "pending");

    const res = await fetch("http://localhost:8000/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url }),
    });

    if (res.ok) {
      setIcon(tab.id, true);
      chrome.tabs.sendMessage(tab.id, { type: "BOOKMARK_ADDED" });
    } else {
      setIcon(tab.id, false);
      chrome.tabs.sendMessage(tab.id, { type: "BOOKMARK_FAILED" });
    }
  } catch (err) {
    console.error("북마크 저장 실패:", err);
    setIcon(tab.id, false);
    chrome.tabs.sendMessage(tab.id, { type: "BOOKMARK_FAILED" });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const bookmarked = await isBookmarked(tab.url);
    setIcon(tabId, bookmarked ? true : false);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openBookmarkSite",
    title: "북마크 사이트 열기",
    contexts: ["action"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "openBookmarkSite") {
    chrome.tabs.create({ url: "http://localhost:3000" });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "BOOKMARK_ADDED") {
    showToast("✅ 북마크가 저장되었습니다!");
  } else if (message.type === "BOOKMARK_ALREADY") {
    showToast("ℹ️ 이미 북마크에 있습니다.");
  } else if (message.type === "BOOKMARK_FAILED") {
    showToast("❌ 북마크 저장 실패!");
  }
});

function showToast(msg) {
  let container = document.getElementById("tagscope-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "tagscope-toast-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 9999,
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.innerText = msg;

  Object.assign(toast.style, {
    padding: "10px 16px",
    background: "rgba(0,0,0,0.8)",
    color: "white",
    borderRadius: "6px",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    opacity: "1",
    transition: "opacity 0.5s",
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}
