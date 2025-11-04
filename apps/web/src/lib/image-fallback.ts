export function cyrb53(str: string) {
  let h1 = 0xdeadbeef ^ 0,
    h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>>
    0;
  return h1 >>> 0;
}

export function hashToIndex(input: string, len: number) {
  return cyrb53(input) % len;
}
