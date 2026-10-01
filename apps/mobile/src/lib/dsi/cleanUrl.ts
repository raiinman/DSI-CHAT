const trackingKeys = new Set(["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "igshid", "_hsenc", "_hsmi"]);
const protectedKeys = new Set(["signature", "sig", "x-amz-signature", "x-goog-signature", "token", "access_token", "code", "state", "auth", "authorization"]);

export function cleanUrl(input: string): string {
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        return input;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return input;
    const keys = Array.from(url.searchParams.keys());
    if (keys.some(key => protectedKeys.has(key.toLowerCase()))) return input;
    let changed = false;
    for (const key of keys) {
        const normalized = key.toLowerCase();
        if (normalized.startsWith("utm_") || trackingKeys.has(normalized)) {
            url.searchParams.delete(key);
            changed = true;
        }
    }
    return changed ? url.toString() : input;
}
