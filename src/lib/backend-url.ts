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
  const timeoutMs = 15000;
  for (const baseUrl of candidates) {
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
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error("Failed to connect to backend");
}
