// =============================================================================
// AUTH UTILITIES - Server-side route protection
// =============================================================================
// These helper functions protect server components and API routes.
// They check if a user is authenticated and redirect accordingly.
//
// Usage in Server Components:
//   const Page = async () => {
//     await requireAuth();  // Redirects to /login if not authenticated
//     return <ProtectedContent />;
//   }
//
// Usage in API Routes:
//   export async function GET() {
//     const session = await requireAuth();
//     return Response.json({ user: session.user });
//   }
// =============================================================================

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// -----------------------------------------------------------------------------
// REQUIRE AUTHENTICATION
// -----------------------------------------------------------------------------
// Use this to protect pages/routes that REQUIRE a logged-in user.
//
// How it works:
// 1. Gets the session cookie from request headers
// 2. Validates the session token with the database
// 3. If no valid session → redirects to /login
// 4. If valid session → returns session object
//
// The session object contains:
//   - session.user.id: User's unique identifier
//   - session.user.email: User's email address
//   - session.user.name: User's display name
//   - session.session.id: Current session ID
//   - session.session.expiresAt: Session expiration date
//
// Example:
//   const Page = async () => {
//     const { user } = await requireAuth();
//     return <div>Welcome, {user.name}!</div>;
//   }
// -----------------------------------------------------------------------------
export const requireAuth = async () => {
  // auth.api.getSession() reads the session cookie and validates it
  // We pass headers() to give it access to request cookies
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // No session = not logged in → send to login page
  if (!session) {
    redirect("/login");
  }

  // Return session for use in the component/route
  return session;
};

// -----------------------------------------------------------------------------
// REQUIRE UNAUTHENTICATED (Guest Only)
// -----------------------------------------------------------------------------
// Use this to protect pages that should ONLY be accessed by guests.
// Typical use: Login and Registration pages.
//
// How it works:
// 1. Checks if user has a valid session
// 2. If logged in → redirects to home page (/)
// 3. If not logged in → allows access (returns null)
//
// Example:
//   // src/app/(auth)/login/page.tsx
//   const LoginPage = async () => {
//     await requireUnauth(); // Logged-in users go to home
//     return <LoginForm />;
//   }
// -----------------------------------------------------------------------------
export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Has session = already logged in → go to home
  if (session) {
    redirect("/");
  }

  return session;
};
