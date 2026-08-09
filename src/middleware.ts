import { defineMiddleware } from "astro:middleware";

const ALLOWED_ORG = "makeshift-engineering";

// Paths that must remain open for the OAuth login flow to work
const AUTH_PATHS = [
  "/api/keystatic/github/login",
  "/api/keystatic/github/oauth/callback",
];

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
    });

    if (!userRes.ok) {
      // Token expired or invalid — clear it and let Keystatic re-auth
      cookies.delete("keystatic-gh-access-token", { path: "/" });
      return next();
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
      }
    );

    if (memberRes.status === 204) {
      // Confirmed org member — allow through
      return next();
    }

    // Not a member (404) or other error — deny access
    cookies.delete("keystatic-gh-access-token", { path: "/" });
    return new Response(
      "Access denied. Only members of the makeshift-engineering organization can use the editor.",
      { status: 403 }
    );
  } catch {
    // Network error talking to GitHub — fail open to avoid locking out
    // editors during transient API outages. The GitHub App's own repo-level
    // permissions are the ultimate access gate.
    return next();
  }
});
