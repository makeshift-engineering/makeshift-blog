import { defineMiddleware } from "astro:middleware";

const ALLOWED_ORG = "makeshift-engineering";

/** Timeout for GitHub API calls (ms) */
const GITHUB_API_TIMEOUT_MS = 5_000;

// Paths that must remain open for the OAuth login flow to work
const AUTH_PATHS = [
  "/api/keystatic/github/login",
  "/api/keystatic/github/oauth/callback",
];

/** 403 — confirmed invalid credentials or non-membership. */
function createDenyResponse() {
  return new Response(
    "Access denied. Only members of the makeshift-engineering organization can use the editor.",
    { status: 403 }
  );
}

/** 503 — GitHub unavailable; token is still valid, try again later. */
function createUnavailableResponse() {
  return new Response(
    "Unable to verify organization membership. GitHub may be unavailable — please try again shortly.",
    { status: 503, headers: { "Retry-After": "30" } }
  );
}

/** True for status codes that indicate the token itself is bad. */
function isInvalidCredentials(status: number): boolean {
  return status === 401;
}

/** True for status codes that indicate a transient GitHub-side issue. */
function isTransientFailure(status: number): boolean {
  return status === 403 || status === 429 || status >= 500;
}

/**
 * Middleware that restricts Keystatic editor access to members of the
 * makeshift-engineering GitHub organization.
 *
 * How it works:
 * 1. Only intercepts /keystatic and /api/keystatic/* routes.
 * 2. Allows the OAuth login/callback routes through unconditionally
 *    (otherwise the user can never authenticate in the first place).
 * 3. If a `keystatic-gh-access-token` cookie is present, uses it to
 *    query GitHub for the authenticated user and verify org membership.
 * 4. Non-members get a 403. Missing tokens redirect to the login flow.
 * 5. Fails closed: any GitHub API error returns 403 or 503 rather than
 *    allowing unauthenticated access.
 *
 * Cookie preservation policy:
 * - Delete the cookie only for confirmed invalid credentials (401).
 * - Preserve it for rate limits (403/429), upstream 5xx, timeouts,
 *   and network errors so the user isn't forced to re-authenticate
 *   when the problem is on GitHub's side.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;
  const path = url.pathname;

  // Only gate /keystatic routes
  if (!path.startsWith("/keystatic") && !path.startsWith("/api/keystatic")) {
    return next();
  }

  // Always let the auth flow itself through (exact path or child segment)
  if (AUTH_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return next();
  }

  const token = cookies.get("keystatic-gh-access-token")?.value;

  // No token yet — let Keystatic handle the redirect to GitHub login
  if (!token) {
    return next();
  }

  try {
    // 1. Who is the authenticated user?
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
    });

    if (!userRes.ok) {
      if (isInvalidCredentials(userRes.status)) {
        // Token is genuinely expired or revoked — delete and deny
        cookies.delete("keystatic-gh-access-token", { path: "/" });
        return createDenyResponse();
      }
      if (isTransientFailure(userRes.status)) {
        // Rate-limited or GitHub is down — keep the token, retry later
        return createUnavailableResponse();
      }
      // Unknown error — deny but preserve the token
      return createDenyResponse();
    }

    const user = (await userRes.json()) as { login: string };

    // 2. Is this user a member of the allowed org?
    const memberRes = await fetch(
      `https://api.github.com/orgs/${ALLOWED_ORG}/members/${user.login}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
      }
    );

    if (memberRes.status === 204) {
      // Confirmed org member — allow through
      return next();
    }

    if (isTransientFailure(memberRes.status)) {
      // Rate-limited or GitHub is down — keep the token, retry later
      return createUnavailableResponse();
    }

    // 404 = confirmed non-member, or other non-transient error — deny
    cookies.delete("keystatic-gh-access-token", { path: "/" });
    return createDenyResponse();
  } catch {
    // Network error or timeout — GitHub is unreachable.
    // Preserve the token; return 503 so the editor can retry.
    return createUnavailableResponse();
  }
});
