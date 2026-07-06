// Lightweight, dependency-free role definitions.
// Safe to import from edge (middleware) and server code alike.

export type Role = "admin" | "kalbadevi" | "bhiwandi";

export const ROLES: Role[] = ["admin", "kalbadevi", "bhiwandi"];

// Head Office (full access) is backed by the `admin` role; Bhiwandi Office by `bhiwandi`.
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Head Office",
  kalbadevi: "Head Office",
  bhiwandi: "Bhiwandi Office",
};

/** Landing page for each role after login. */
export function homePathForRole(role: Role): string {
  switch (role) {
    case "bhiwandi":
      return "/receiving";
    default:
      return "/dashboard";
  }
}

/** Which roles may access a given path prefix. `null` = any authenticated user. */
export function allowedRolesFor(pathname: string): Role[] | null {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/returns/new")) return ["admin", "kalbadevi"];
  if (pathname.match(/^\/returns\/[^/]+\/edit/)) return ["admin", "kalbadevi"];
  if (pathname.startsWith("/receiving")) return ["admin", "bhiwandi"];
  // /dashboard, /returns (list/detail), /reports -> any logged-in user
  return null;
}
