const METERED_API_URL = "https://triphung.metered.live/api/v1/turn/credentials?apiKey=2fa8ee14b05e050c80c9963dc0f072e59d75";

// Cache the fetched ICE servers so we don't call the API on every connection
let cachedIceServers: RTCIceServer[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch dynamic TURN credentials from Metered.ca API.
 * Falls back to STUN-only if the API call fails.
 */
export async function getIceServers(): Promise<RTCIceServer[]> {
    // Return cached if still valid
    if (cachedIceServers && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        return cachedIceServers;
    }

    try {
        const response = await fetch(METERED_API_URL);
        const iceServers = await response.json();
        console.log("[WebRTC] Fetched TURN credentials from Metered.ca:", iceServers.length, "servers");
        cachedIceServers = iceServers;
        cacheTimestamp = Date.now();
        return iceServers;
    } catch (err) {
        console.warn("[WebRTC] Failed to fetch TURN credentials, falling back to STUN only:", err);
        return [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ];
    }
}
