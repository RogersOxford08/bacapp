import { nip19, finalizeEvent, getPublicKey } from 'https://esm.sh/nostr-tools@2.7.0/pure';
import { Relay } from 'https://esm.sh/nostr-tools@2.7.0/relay';

let sk = null;      // Uint8Array secret key
let pk = null;      // hex pubkey
let relay = null;   // active Relay connection
let worker = null;  // active mining Web Worker

const $ = (id) => document.getElementById(id);
const log = (msg) => {
  const el = $('log');
  el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
};

// ---------- 1. LOGIN ----------
$('loginBtn').onclick = () => {
  const raw = $('nsecInput').value.trim();
  try {
    const decoded = nip19.decode(raw);
    if (decoded.type !== 'nsec') throw new Error('Not an nsec key');
    sk = decoded.data;
    pk = getPublicKey(sk);
    $('loginStatus').textContent = `Logged in as ${pk.slice(0, 12)}...`;
    log(`Logged in. pubkey=${pk}`);
  } catch (err) {
    $('loginStatus').textContent = `Error: ${err.message}`;
    log(`Login failed: ${err.message}`);
  }
};

// ---------- 2. RELAY ----------
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
  } catch (err) {
    $('relayStatus').textContent = `Failed to connect: ${err.message}`;
    log(`Relay connect error: ${err.message}`);
  }
};

// ---------- 3. DIFFICULTY SLIDER ----------
$('difficultySlider').oninput = (e) => {
  $('difficultyLabel').textContent = `${e.target.value} bits`;
};

// ---------- 3. MINE + PUBLISH ----------
$('mineBtn').onclick = () => {
  if (!sk || !pk) return log('Error: log in first.');
  if (!relay) return log('Error: connect to a relay first.');

  const content = $('content').value.trim();
  if (!content) return log('Error: write something first.');

  const difficulty = parseInt($('difficultySlider').value, 10);

  const template = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: pk,
    tags: [],
    content,
  };

  startMining(template, difficulty);
};

$('cancelBtn').onclick = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    setMiningUI(false);
    $('mineStatus').textContent = 'Cancelled.';
    log('Mining cancelled by user.');
  }
};

function setMiningUI(isMining) {
  $('mineBtn').disabled = isMining;
  $('cancelBtn').disabled = !isMining;
  $('difficultySlider').disabled = isMining;
  $('content').disabled = isMining;
}

function startMining(template, difficulty) {
  setMiningUI(true);
  $('progressBar').style.width = '0%';
  $('mineStatus').textContent = `Mining at difficulty ${difficulty}...`;
  log(`Starting PoW mining, target difficulty=${difficulty}`);

  const expectedAttempts = Math.pow(2, difficulty);

  worker = new Worker('pow-worker.js', { type: 'module' });
  worker.postMessage({ template, difficulty });

  worker.onmessage = (e) => {
    const { type } = e.data;

    if (type === 'progress') {
      const { attempts } = e.data;
      const pct = Math.min(100, (attempts / expectedAttempts) * 100);
      $('progressBar').style.width = `${pct.toFixed(1)}%`;
      $('mineStatus').textContent =
        `Mining... ${attempts.toLocaleString()} attempts (~${pct.toFixed(1)}% of expected)`;
    }

    if (type === 'found') {
      const { minedEvent, attempts, ms } = e.data;
      $('progressBar').style.width = '100%';
      $('mineStatus').textContent =
        `Found valid nonce after ${attempts.toLocaleString()} attempts (${(ms / 1000).toFixed(2)}s).`;
      log(`Mined event id=${minedEvent.id} attempts=${attempts} time=${ms}ms`);
      publishEvent(minedEvent);
      worker.terminate();
      worker = null;
      setMiningUI(false);
    }

    if (type === 'error') {
      $('mineStatus').textContent = `Error: ${e.data.message}`;
      log(`Mining error: ${e.data.message}`);
      worker.terminate();
      worker = null;
      setMiningUI(false);
    }
  };
}

async function publishEvent(minedEvent) {
  try {
    const signed = finalizeEvent(minedEvent, sk);
    await relay.publish(signed);
    log(`Published! id=${signed.id}`);
    $('content').value = '';
  } catch (err) {
    log(`Publish failed: ${err.message}`);
  }
}