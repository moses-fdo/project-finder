// Centralized error handler for API calls
// Ensures consistent error messages and safety

export function getErrorMessage(error: unknown, defaultMessage: string = "Something went wrong."): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "error" in error) {
    return String(error.error) || defaultMessage;
  }
  return defaultMessage;
}

export function safeJsonParse(response: Response): Promise<any> {
  return response.json().catch(() => ({}));
}
