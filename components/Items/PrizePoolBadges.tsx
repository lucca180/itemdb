import { Badge } from '@chakra-ui/react';
import { parsePoolName } from '@utils/item/prizePoolName';

type PrizePoolBadgesProps = {
  name: string;
  /** Computed by getItemDrops — can be true even when the name has no "chance". */
  isChance?: boolean;
};

/** Badges for the behavior a prize pool name triggers in getItemDrops. */
export const PrizePoolBadges = ({ name, isChance }: PrizePoolBadgesProps) => {
  const parsed = parsePoolName(name);
  const badges: { label: string; color: string }[] = [];

  if (parsed.isBonus) badges.push({ label: 'Bonus', color: 'yellow' });
  if (parsed.isLE) badges.push({ label: 'LE', color: 'green' });
  if (parsed.isChance) badges.push({ label: 'Chance', color: 'blue' });
  else if (isChance) badges.push({ label: 'Chance (auto)', color: 'blue' });
  if (parsed.isOld) badges.push({ label: 'Old', color: 'gray' });
  if (parsed.isGram) badges.push({ label: 'Gram (whole item)', color: 'purple' });
  if (parsed.minDrop !== null)
    badges.push({ label: `${parsed.minDrop}-${parsed.maxDrop} drops`, color: 'gray' });

  if (!badges.length)
    return (
      <Badge size="sm" variant="outline">
        No flags
      </Badge>
    );

  return (
    <>
      {badges.map(({ label, color }) => (
        <Badge key={label} size="sm" colorPalette={color}>
          {label}
        </Badge>
      ))}
    </>
  );
};
