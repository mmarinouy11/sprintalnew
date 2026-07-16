import type { Role } from "@/types";

/**
 * Role ranking for permission checks (spec section 5).
 * viewer < editor < admin < owner.
 */
const RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

/** Whether `role` meets or exceeds `min` in the permission hierarchy. */
export function roleAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

export function isRole(value: unknown): value is Role {
  return (
    value === "owner" ||
    value === "admin" ||
    value === "editor" ||
    value === "viewer"
  );
}
