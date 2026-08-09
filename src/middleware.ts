import { defineMiddleware } from "astro:middleware";

const ALLOWED_ORG = "makeshift-engineering";

/** Timeout for GitHub API calls (ms) */
const GITHUB_API_TIMEOUT_MS = 5_000;

// Paths that must remain open for the OAuth login flow to work
const AUTH_PATHS = [
  "/api/keystatic/github/login",
  "/api/keystatic/github/oauth/callback",
];

const DENY_RESPONSE = new Response(
  "Access denied. Only members of the makeshift-engineering organization can use the editor.",
  { status: 403 },
);

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
 * 5. Fails closed: any GitHub API error (rate-limit, network, timeout)
 *    returns 403 rather than allowing unauthenticated access.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;
  const path = url.pathname;

  // Only gate /keystatic routes
  if (!path.startsWith("/keystatic") && !path.startsWith("/api/keystatic")) {
    return next();
  }

  // Always let the auth flow itself through
  if (AUTH_PATHS.some((p) => path.startsWith(p))) {
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
      // Token expired, invalid, or rate-limited — clear it and deny
      cookies.delete("keystatic-gh-access-token", { path: "/" });
      return DENY_RESPONSE;
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
      },
    );

    if (memberRes.status === 204) {
      // Confirmed org member — allow through
      return next();
    }

    // Not a member (404) or other error — deny access
    cookies.delete("keystatic-gh-access-token", { path: "/" });
    return DENY_RESPONSE;
  } catch {
    // Network error or timeout talking to GitHub — fail closed.
    // The editor is inaccessible until GitHub is reachable again,
    // which is preferable to letting unauthenticated requests through.
    return DENY_RESPONSE;
  }
});
