const FALLBACK_PUBLIC_ORIGIN = "https://corretoraia.lovable.app";

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

export function getPublicAppOrigin() {
  if (typeof window === "undefined") {
    return FALLBACK_PUBLIC_ORIGIN;
  }

  const { origin, hostname } = window.location;
  const isPreviewHost =
    hostname.endsWith(".lovableproject.com") ||
    hostname.startsWith("id-preview--") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  return isPreviewHost ? FALLBACK_PUBLIC_ORIGIN : normalizeOrigin(origin);
}

export function getPublicProposalUrl(slug: string, providedPath?: string | null) {
  const baseOrigin = getPublicAppOrigin();
  const candidate = providedPath && providedPath.trim().length > 0 ? providedPath : `/p/${slug}`;

  try {
    return new URL(candidate, `${baseOrigin}/`).toString();
  } catch {
    return `${baseOrigin}/p/${slug}`;
  }
}
