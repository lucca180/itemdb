/** Studio consumables featured on the Pet Styles hub (and reverse Related Links). */

export const STUDIO_ESSENTIAL_ITEM_NAMES = [
  'Styling Studio Supplies',
  'Deluxe Styling Studio Supplies',
  'Styling Studio Prismatic Brush',
  'Styling Studio Deluxe Prismatic Brush',
  'Styling Studio Restyle Paint',
] as const;

export type StudioEssentialItemName = (typeof STUDIO_ESSENTIAL_ITEM_NAMES)[number];

export function isStudioEssentialItemName(name: string): name is StudioEssentialItemName {
  return (STUDIO_ESSENTIAL_ITEM_NAMES as readonly string[]).includes(name);
}
