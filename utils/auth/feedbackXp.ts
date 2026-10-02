/** Users at or below this XP lose access to the feedback system (and other user-only tools). */
export const BANNED_XP_THRESHOLD = -1000;

/** Users at or below this XP see a warning asking them to review the feedback guidelines. */
export const LOW_XP_WARNING_THRESHOLD = -300;

export const isUserBanned = (user: { xp: number; flags?: string | null }) =>
  user.xp < BANNED_XP_THRESHOLD || !!user.flags?.includes('temp_mail');

export const isLowXpWarning = (user: { xp: number; role?: string; banned?: boolean }) =>
  user.role !== 'ADMIN' && !user.banned && user.xp <= LOW_XP_WARNING_THRESHOLD;
