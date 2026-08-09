// Import everything from the package root to avoid submodule export
// mismatches (e.g. nip19 is not part of the /pure submodule).
import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  nip19,
  Relay,
} from 'https://esm.sh/nostr-tools@2.7.0';

const $ = (id) => document.getElementById(id);

let sk = null;
let pk = null;
let relay = null;
let relayMinDifficulty = null;
let worker = null;
let minedEvent = null;

function log(msg) {
  const el = $('log');
  const time = new Date().toLocaleTimeString();
  el.textContent += `[${time}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
}

// -------------------- Identity --------------------

$('loginBtn').onclick = () => {
  sk = generateSecretKey();
  pk = getPublicKey(sk);

  const npub = nip19.npubEncode(pk);
  const nsec = nip19.nsecEncode(sk);

  $('loginStatus').textContent = `Logged in as ${npub}`;
  log(`Generated new keypair.`);
  log(`npub: ${npub}`);
  log(`nsec: ${nsec} (keep this secret!)`);
};

// -------------------- Relay + NIP-11 --------------------

$('connectBtn').onclick = async () => {
  const url = $('relayInput').value.trim();
  try {
    if (relay) relay.close();
    relay = await Relay.connect(url);
    $('relayStatus').textContent = `Connected to ${url}`;
    log(`Connected to relay: ${url}`);

    relay.onclose = () => {
      $('relayStatus').textContent = 'Disconnected.';
      log('Relay connection closed.');
    };

    await fetchNip11Info(url);
  } catch (err) {
    $('relayStatus').textContent = `Failed to connect: ${err.message}`;
    log(`Relay connect error: ${err.message}`);
  }
};

async function fetchNip11Info(wsUrl) {
  relayMinDifficulty = null;
  $('nip11Status').textContent = 'NIP-11 info: fetching...';

  const httpUrl = wsUrl
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://');

  try {
    const res = await fetch(httpUrl, {
      headers: { Accept: 'application/nostr+json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const info = await res.json();
    const name = info.name || '(unnamed relay)';
    const minPow = info.limitation?.min_pow_difficulty ?? null;

    if (minPow !== null && minPow > 0) {
      relayMinDifficulty = minPow;
      $('nip11Status').textContent =
        `NIP-11 info: "${name}" requires min PoW difficulty = ${minPow} bits`;
      log(`Relay NIP-11: min_pow_difficulty=${minPow}`);

      const slider = $('difficultySlider');
      if (parseInt(slider.value, 10) < minPow) {
        slider.value = Math.min(minPow, parseInt(slider.max, 10));
        $('difficultyLabel').textContent = `${slider.value} bits`;
        log(`Difficulty slider auto-raised to ${slider.value} bits to meet relay minimum.`);
      }
    } else {
      $('nip11Status').textContent = `NIP-11 info: "${name}" — no minimum PoW required.`;
      log('Relay NIP-11: no min_pow_difficulty specified.');
    }
  } catch (err) {
    $('nip11Status').textContent = `NIP-11 info: unavailable (${err.message})`;
    log(`NIP-11 fetch failed: ${err.message}`);
  }
}

// -------------------- Difficulty slider --------------------

$('difficultySlider').oninput = (e) => {
  $('difficultyLabel').textContent = `${e.target.value} bits`;
};

// -------------------- Mining --------------------

$('mineBtn').onclick = () => {
  if (!sk || !pk) return log('Error: log in first.');
  if (!relay) return log('Error: connect to a relay first.');

  const content = $('content').value.trim();
  if (!content) return log('Error: write something first.');

  const difficulty = parseInt($('difficultySlider').value, 10);

  if (relayMinDifficulty !== null && difficulty < relayMinDifficulty) {
    const proceed = confirm(
      `This relay requires at least ${relayMinDifficulty} bits of PoW, but your slider is set to ${difficulty}. The relay will likely reject this event. Mine anyway?`
    );
    if (!proceed) return;
    log(`Warning: mining below relay minimum (${difficulty} < ${relayMinDifficulty}).`);
  }

  const template = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: pk,
    tags: [],
    content,
  };

  startMining(template, difficulty);
};

function startMining(template, difficulty) {
  minedEvent = null;
  $('publishBtn').disabled = true;
  $('mineBtn').disabled = true;
  $('stopMineBtn').disabled = false;
  $('mineStatus').textContent = `Mining at difficulty ${difficulty}...`;
  log(`Starting mining: difficulty=${difficulty}`);

  worker = new Worker('pow-worker.js', { type: 'module' });

  worker.onmessage = (e) => {
    const { type, tags, nonce, attempts, hash, elapsedMs } = e.data;

    if (type === 'progress') {
      $('mineStatus').textContent = `Mining... ${attempts.toLocaleString()} attempts`;
      return;
    }

    if (type === 'done') {
      const finishedTemplate = {
        ...template,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      minedEvent = finalizeEvent(finishedTemplate, sk);

      $('mineStatus').textContent =
        `Found nonce=${nonce} after ${attempts.toLocaleString()} attempts ` +
        `(${(elapsedMs / 1000).toFixed(1)}s). Hash: ${hash}`;
      log(`Mining complete. nonce=${nonce}, attempts=${attempts}, id=${minedEvent.id}`);

      stopMining();
      $('publishBtn').disabled = false;
    }
  };

  worker.postMessage({ type: 'start', template, difficulty });
}

$('stopMineBtn').onclick = () => {
  stopMining();
  $('mineStatus').textContent = 'Mining stopped.';
  log('Mining stopped by user.');
};

function stopMining() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  $('mineBtn').disabled = false;
  $('stopMineBtn').disabled = true;
}

// -------------------- Publish --------------------

$('publishBtn').onclick = async () => {
  if (!minedEvent) return log('Error: no mined event to publish.');
  if (!relay) return log('Error: connect to a relay first.');

  try {
    log(`Publishing event id=${minedEvent.id}...`);
    await relay.publish(minedEvent);
    log(`Event published successfully.`);
    $('mineStatus').textContent = `Published: ${minedEvent.id}`;
  } catch (err) {
    log(`Publish failed: ${err.message}`);
  }
};