
/**
 * Safe JSON parsing that doesn't throw on error responses
 */
export async function safeJson(response: Response): Promise<{ data: any, error?: string }> {
  if (!response.ok) {
    return { data: {}, error: "Request failed" };
  }
  try {
    const data = await response.json();
    return { data };
  } catch {
    return { data: {} };
  }
}

/**
 * Safe error builder that extracts meaningful error messages
 */
export function safeError(res: Response, defaultMsg: string = "Request failed"): string {
  if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
    try {
      // Try to parse error
    } catch {}
  }
  return defaultMsg;
}
