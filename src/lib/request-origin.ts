export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}
