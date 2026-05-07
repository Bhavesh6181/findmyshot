export function backendCandidates(): string[] {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  if (backendUrl.includes("localhost")) {
    return [backendUrl, backendUrl.replace("localhost", "127.0.0.1")];
  }
  return [backendUrl];
}

export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  const candidates = backendCandidates();
  if (candidates.length === 0) {
    throw new Error("BACKEND_URL is not configured");
  }

  let lastError: unknown = null;
  // Render free instances can cold start slowly, so keep a larger timeout.
  const timeoutMs = 45000;
  const maxAttempts = 2;
  for (const baseUrl of candidates) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          ...init,
          signal: init?.signal ?? controller.signal,
        });
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
  throw lastError ?? new Error("Failed to connect to backend");
}
