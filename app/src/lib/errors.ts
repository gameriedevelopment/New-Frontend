export function getApiErrorMessage(error: unknown, fallback: string) {
  const candidate = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };
  const message = candidate.response?.data?.message ?? candidate.message;

  if (Array.isArray(message)) return message.join(", ");
  if (message && typeof message === "object") {
    const nested = (message as { message?: unknown }).message;
    return typeof nested === "string" ? nested : fallback;
  }
  return typeof message === "string" && message.trim() ? message : fallback;
}
