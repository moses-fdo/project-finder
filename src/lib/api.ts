/**
 * Safe JSON parsing that doesn't throw on error responses
 */
export async function safeJson<T = unknown>(
  response: Response
): Promise<{ data: T; error?: string }> {
  if (!response.ok) {
    return { data: {} as T, error: "Request failed" };
  }
  try {
    const data = (await response.json()) as T;
    return { data };
  } catch {
    return { data: {} as T };
  }
}

/**
 * Extract a meaningful error message from a failed response body
 */
export async function safeError(
  res: Response,
  defaultMsg: string = "Request failed"
): Promise<string> {
  if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      return data.error || data.message || defaultMsg;
    } catch {
      // fall through to default
    }
  }
  return defaultMsg;
}
