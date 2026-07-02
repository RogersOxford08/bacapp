<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NOSTR Custom Feed</title>
<style>
  :root {
    --bg: #0f0f0f;
    --panel: #1a1a1a;
    --border: #2a2a2a;
    --text: #e6e6e6;
    --muted: #888;
    --accent: #7c3aed;
    --error: #e05252;
    --success: #4caf50;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  header {
    padding: 12px 16px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  header input {
    background: #111;
    border: 1px solid var(--border);
    color: var(--text);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 14px;
  }
  header button {
    background: var(--accent);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }
  header button:hover { opacity: 0.85; }
  .status {
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .status.connected { background: rgba(76,175,80,0.15); color: var(--success); }
  .status.disconnected { background: rgba(224,82,82,0.15); color: var(--error); }
  .status.connecting { background: rgba(255,193,7,0.15); color: #ffc107; }

  .layout {
    display: flex;
    max-width: 900px;
    margin: 0 auto;
  }
  aside {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    padding: 12px;
    min-height: 80vh;
  }
  aside h3 {
    font-size: 13px;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 8px;
  }
  .npub-form {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .npub-form input {
    flex: 1;
    width: 100%;
  }
  .npub-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .npub-item img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #333;
    object-fit: cover;
  }
  .npub-item .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .npub-item button {
    background: none;
    border: none;
    color: var(--error);
    cursor: pointer;
    font-size: 12px;
  }

  main {
    flex: 1;
    padding: 12px;
  }
  .empty-state {
    color: var(--muted);
    text-align: center;
    padding: 40px 20px;
    font-size: 14px;
  }
  .note {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .note-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .note-header img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #333;
    object-fit: cover;
  }
  .note-header .author {
    font-weight: 600;
    font-size: 14px;
  }
  .note-header .time {
    color: var(--muted);
    font-size: 12px;
    margin-left: auto;
  }
  .note-content {
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .note-content img {
    max-width: 100%;
    border-radius: 6px;
    margin-top: 8px;
  }
  .note-content a {
    color: var(--accent);
  }
  #loading-indicator {
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    padding: 10px;
  }
</style>
</head>
<body>

<header>
  <input id="relay-input" type="text" placeholder="wss://relay.example.com" />
  <button id="relay-connect-btn">Connect</button>
  <span id="relay-status" class="status disconnected">disconnected</span>
</header>

<div class="layout">
  <aside>
    <h3>Followed npubs</h3>
    <div class="npub-form">
      <input id="npub-input" type="text" placeholder="npub1..." />
      <button id="npub-add-btn">Add</button>
    </div>
    <div id="npub-error" style="color:var(--error);font-size:12px;margin-bottom:8px;"></div>
    <div id="npub-list"></div>
  </aside>

  <main>
    <div id="loading-indicator" style="display:none;">Loading events...</div>
    <div id="feed"></div>
    <div id="feed-empty" class="empty-state">
      Add a relay and at least one npub to see a feed.
    </div>
  </main>
</div>

<script type="module">
import { nip19, utils } from "https://esm.sh/nostr-tools@2.7.0";

// ---------- State ----------
const state = {
  relayUrl: localStorage.getItem("nostr_relay") || "",
  pubkeys: JSON.parse(localStorage.getItem("nostr_pubkeys") || "[]"), // hex pubkeys
  profiles: {}, // hex -> {name, picture}
  events: new Map(), // id -> event
  ws: null,
  subIdNotes: "feed-notes-" + Math.random().toString(36).slice(2),
  subIdProfiles: "feed-profiles-" + Math.random().toString(36).slice(2),
  connected: false,
};

// ---------- DOM refs ----------
const relayInput = document.getElementById("relay-input");
const relayConnectBtn = document.getElementById("relay-connect-btn");
const relayStatus = document.getElementById("relay-status");
const npubInput = document.getElementById("npub-input");
const npubAddBtn = document.getElementById("npub-add-btn");
const npubError = document.getElementById("npub-error");
const npubList = document.getElementById("npub-list");
const feedEl = document.getElementById("feed");
const feedEmpty = document.getElementById("feed-empty");
const loadingIndicator = document.getElementById("loading-indicator");

// ---------- Utility ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    if (isImage) {
      return `<br><img src="${url}" loading="lazy" />`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

function shortenNpub(npub) {
  return npub.slice(0, 10) + "…" + npub.slice(-6);
}

function saveConfig() {
  localStorage.setItem("nostr_relay", state.relayUrl);
  localStorage.setItem("nostr_pubkeys", JSON.stringify(state.pubkeys));
}

// ---------- Relay connection ----------
function setStatus(text, cls) {
  relayStatus.textContent = text;
  relayStatus.className = "status " + cls;
}

function connectRelay() {
  if (!state.relayUrl) return;

  if (state.ws) {
    try { state.ws.close(); } catch (e) {}
  }

  setStatus("connecting", "connecting");
  let ws;
  try {
    ws = new WebSocket(state.relayUrl);
  } catch (e) {
    setStatus("invalid url", "disconnected");
    return;
  }
  state.ws = ws;

  ws.onopen = () => {
    state.connected = true;
    setStatus("connected", "connected");
    subscribeAll();
  };

  ws.onclose = () => {
    state.connected = false;
    setStatus("disconnected", "disconnected");
    // simple retry after delay
    setTimeout(() => {
      if (state.relayUrl && state.ws === ws) connectRelay();
    }, 4000);
  };

  ws.onerror = () => {
    setStatus("error", "disconnected");
  };

  ws.onmessage = (msg) => {
    let data;
    try {
      data = JSON.parse(msg.data);
    } catch (e) {
      return;
    }
    handleRelayMessage(data);
  };
}

function handleRelayMessage(data) {
  const [type, subId, event] = data;

  if (type === "EVENT") {
    if (subId === state.subIdNotes) {
      handleNoteEvent(event);
    } else if (subId === state.subIdProfiles) {
      handleProfileEvent(event);
    }
  } else if (type === "EOSE") {
    loadingIndicator.style.display = "none";
  } else if (type === "NOTICE") {
    console.warn("Relay notice:", subId);
  }
}

function sendReq(subId, filter) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify(["REQ", subId, filter]));
}

function closeSub(subId) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify(["CLOSE", subId]));
}

function subscribeAll() {
  if (state.pubkeys.length === 0) {
    renderEmptyState();
    return;
  }
  loadingIndicator.style.display = "block";
  closeSub(state.subIdNotes);
  closeSub(state.subIdProfiles);

  sendReq(state.subIdNotes, {
    kinds: [1],
    authors: state.pubkeys,
    limit: 100,
  });

  sendReq(state.subIdProfiles, {
    kinds: [0],
    authors: state.pubkeys,
  });
}

// ---------- Event handling ----------
function handleNoteEvent(event) {
  if (state.events.has(event.id)) return;
  state.events.set(event.id, event);
  renderFeed();
}

function handleProfileEvent(event) {
  try {
    const meta = JSON.parse(event.content);
    const existing = state.profiles[event.pubkey];
    if (!existing || existing._created_at < event.created_at) {
      state.profiles[event.pubkey] = {
        name: meta.name || meta.display_name || "",
        picture: meta.picture || "",
        _created_at: event.created_at,
      };
      renderNpubList();
      renderFeed();
    }
  } catch (e) {
    // ignore malformed metadata
  }
}

// ---------- Rendering ----------
function renderEmptyState() {
  const hasRelay = !!state.relayUrl;
  const hasNpubs = state.pubkeys.length > 0;
  feedEmpty.style.display = (hasRelay && hasNpubs) ? "none" : "block";
  if (!hasRelay) {
    feedEmpty.textContent = "Add and connect a relay to get started.";
  } else if (!hasNpubs) {
    feedEmpty.textContent = "Add at least one npub to see a feed.";
  }
}

function renderFeed() {
  renderEmptyState();
  const sorted = Array.from(state.events.values())
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 500); // cap in-memory events rendered

  feedEl.innerHTML = sorted.map(renderNote).join("");
}

function renderNote(event) {
  const profile = state.profiles[event.pubkey] || {};
  const npub = nip19.npubEncode(event.pubkey);
  const name = profile.name || shortenNpub(npub);
  const avatar = profile.picture || "";
  const date = new Date(event.created_at * 1000).toLocaleString();
  const content = linkify(escapeHtml(event.content));

  return `
    <div class="note">
      <div class="note-header">
        ${avatar ? `<img src="${avatar}" loading="lazy" />` : `<img src="" style="visibility:hidden" />`}
        <span class="author">${escapeHtml(name)}</span>
        <span class="time">${date}</span>
      </div>
      <div class="note-content">${content}</div>
    </div>
  `;
}

function renderNpubList() {
  npubList.innerHTML = state.pubkeys.map((hex) => {
    const npub = nip19.npubEncode(hex);
    const profile = state.profiles[hex] || {};
    const name = profile.name || shortenNpub(npub);
    const avatar = profile.picture || "";
    return `
      <div class="npub-item" data-hex="${hex}">
        ${avatar ? `<img src="${avatar}" loading="lazy" />` : `<img src="" style="visibility:hidden" />`}
        <span class="name" title="${npub}">${escapeHtml(name)}</span>
        <button data-remove="${hex}">✕</button>
      </div>
    `;
  }).join("");

  npubList.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeNpub(btn.dataset.remove));
  });
}

// ---------- Npub management ----------
function addNpub(npubStr) {
  npubError.textContent = "";
  npubStr = npubStr.trim();

  let hex;
  try {
    const decoded = nip19.decode(npubStr);
    if (decoded.type !== "npub") throw new Error("Not an npub");
    hex = decoded.data;
  } catch (e) {
    npubError.textContent = "Invalid npub format.";
    return;
  }

  if (state.pubkeys.includes(hex)) {
    npubError.textContent = "Already added.";
    return;
  }

  state.pubkeys.push(hex);
  saveConfig();
  renderNpubList();
  renderEmptyState();
  npubInput.value = "";

  if (state.connected) subscribeAll();
}

function removeNpub(hex) {
  state.pubkeys = state.pubkeys.filter((k) => k !== hex);
  saveConfig();
  renderNpubList();

  // remove their notes from the feed
  for (const [id, ev] of state.events) {
    if (ev.pubkey === hex) state.events.delete(id);
  }
  renderFeed();

  if (state.connected) subscribeAll();
}

// ---------- Relay management ----------
function setRelay(url) {
  url = url.trim();
  if (!/^wss?:\/\//.test(url)) {
    setStatus("invalid url", "disconnected");
    return;
  }
  state.relayUrl = url;
  saveConfig();
  connectRelay();
}

// ---------- Event listeners ----------
relayConnectBtn.addEventListener("click", () => setRelay(relayInput.value));
relayInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setRelay(relayInput.value);
});

npubAddBtn.addEventListener("click", () => addNpub(npubInput.value));
npubInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addNpub(npubInput.value);
});

// ---------- Init ----------
function init() {
  relayInput.value = state.relayUrl;
  renderNpubList();
  renderEmptyState();
  if (state.relayUrl) connectRelay();
}

init();
</script>

</body>
</html>
