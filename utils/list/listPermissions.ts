/**
 * List permission rules shared by the list API routes and the list UI.
 *
 * Official lists are curated by their owner, but they belong to itemdb: only admins can change
 * the list itself (name, description, cover, visibility, dynamic settings...) or delete it.
 * Curators can still manage the list items.
 */

type ListPermissionTarget = {
  official: boolean;
  /** Owner user id (`UserList.user_id` on the server, `list.owner.id` on the client). */
  ownerId: string;
};

type ListPermissionUser = { id: string; isAdmin?: boolean } | null | undefined;

/** Can change the list fields (not its items). Admins always can; owners only on non-official lists. */
export function canEditListInfo(list: ListPermissionTarget, user: ListPermissionUser): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;

  return list.ownerId === user.id && !list.official;
}

/** Same rule as editing: official lists can only be deleted by admins. */
export const canDeleteList = canEditListInfo;
