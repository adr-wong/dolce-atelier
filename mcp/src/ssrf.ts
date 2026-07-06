const ALLOWED_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "upload.wikimedia.org",
];

// RFC reserved IP ranges (regex patterns)
const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fd00:/,
  /^fe80:/,
];

export async function validateImageUrl(
  urlStr: string,
): Promise<{ ok: boolean; error?: string }> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: `Only http/https allowed, got ${url.protocol}` };
  }

  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(url.hostname)) {
    return {
      ok: false,
      error: `Host "${url.hostname}" is not in the allowed list`,
    };
  }

  // Resolve IP and reject private ranges (DNS-rebinding protection)
  try {
    const { lookup } = await import("node:dns/promises");
    const { address } = await lookup(url.hostname);
    for (const range of PRIVATE_RANGES) {
      if (range.test(address)) {
        return { ok: false, error: `Resolved to private IP ${address}` };
      }
    }
  } catch {
    return { ok: false, error: "DNS resolution failed" };
  }

  return { ok: true };
}
