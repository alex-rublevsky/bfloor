export function getDashboardReturnTo(requestUrl: URL): string {
  const fallback = "/dashboard";
  const requested = requestUrl.searchParams.get("returnTo");
  if (!requested) return fallback;

  try {
    const target = new URL(requested, requestUrl);
    const isDashboardPath =
      target.pathname === fallback ||
      target.pathname.startsWith(`${fallback}/`);

    if (target.origin !== requestUrl.origin || !isDashboardPath) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
