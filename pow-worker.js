// Worker-side proof-of-work miner for Nostr NIP-13.
// Imports crypto/serialization helpers from nostr-tools root
// (avoids the /pure submodule export mismatch seen in app.js).
import { finalizeEvent } from 'https://esm.sh/nostr-tools@2.7.0';
import { sha256 } from 'https://esm.sh/@noble/hashes@1.4.0/sha256';
import { bytesToHex, utf8ToBytes } from 'https://esm.sh/@noble/hashes@1.4.0/utils';

// Serializes an unsigned event per NIP-01 to compute its id hash,
// mirroring what nostr-tools does internally, so we can iterate
// on the nonce tag without needing a signature on every attempt.
function serializeEvent(evt) {
  return JSON.stringify([
    0,
    evt.pubkey,
    evt.created_at,
    evt.kind,
    evt.tags,
    evt.content,
  ]);
}

function countLeadingZeroBits(hashHex) {
  let bits = 0;
  for (let i = 0; i < hashHex.length; i++) {
    const nibble = parseInt(hashHex[i], 16);
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    // Count leading zero bits within this nibble.
    if (nibble < 8) bits += 1;
    if (nibble < 4) bits += 1;
    if (nibble < 2) bits += 1;
    break;
  }
  return bits;
}

let running = false;

self.onmessage = (e) => {
  const { type, template, difficulty } = e.data;

  if (type === 'start') {
    running = true;
    mine(template, difficulty);
  } else if (type === 'stop') {
    running = false;
  }
};

async function mine(template, difficulty) {
  const startTime = Date.now();
  let nonce = 0;
  let attempts = 0;

  // Base tags, plus a nonce tag we mutate each iteration.
  const baseTags = [...(template.tags || [])];

  while (running) {
    const nonceStr = String(nonce);
    const tags = [...baseTags, ['nonce', nonceStr, String(difficulty)]];

    const candidate = {
      pubkey: template.pubkey,
      created_at: template.created_at,
      kind: template.kind,
      tags,
      content: template.content,
    };

    const serialized = serializeEvent(candidate);
    const hashBytes = sha256(utf8ToBytes(serialized));
    const hashHex = bytesToHex(hashBytes);
    const leadingZeroBits = countLeadingZeroBits(hashHex);

    attempts++;

    if (leadingZeroBits >= difficulty) {
      self.postMessage({
        type: 'done',
        tags,
        nonce: nonceStr,
        attempts,
        hash: hashHex,
        elapsedMs: Date.now() - startTime,
      });
      running = false;
      return;
    }

    if (attempts % 2000 === 0) {
      self.postMessage({ type: 'progress', attempts });
      // Yield briefly so the worker stays responsive to 'stop' messages.
      await new Promise((r) => setTimeout(r, 0));
    }

    nonce++;
  }
}