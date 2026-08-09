import { sha256 } from 'https://esm.sh/@noble/hashes@1.5.0/sha256';

function countLeadingZeroBits(hashBytes) {
  let bits = 0;
  for (const byte of hashBytes) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(byte) - 24; // clz32 counts zero bits in a 32-bit int
    break;
  }
  return bits;
}

function serializeEventForId(event) {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

self.onmessage = (e) => {
  const { template, difficulty } = e.data;
  const start = performance.now();

  const tags = [...template.tags, ['nonce', '0', String(difficulty)]];
  const nonceIndex = tags.length - 1;

  let nonce = 0;
  const MAX_ATTEMPTS = 100_000_000;

  try {
    while (nonce < MAX_ATTEMPTS) {
      tags[nonceIndex] = ['nonce', String(nonce), String(difficulty)];
      const candidate = { ...template, tags };
      const serialized = serializeEventForId(candidate);
      const hashBytes = sha256(new TextEncoder().encode(serialized));

      if (countLeadingZeroBits(hashBytes) >= difficulty) {
        const hex = Array.from(hashBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        candidate.id = hex;
        self.postMessage({
          type: 'found',
          minedEvent: candidate,
          attempts: nonce + 1,
          ms: performance.now() - start,
        });
        return;
      }

      nonce++;
      if (nonce % 2000 === 0) {
        self.postMessage({ type: 'progress', attempts: nonce });
      }
    }

    self.postMessage({ type: 'error', message: 'Exceeded max attempts without success.' });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};