import { Badge, Flex, Icon, Text, Tooltip } from '@chakra-ui/react';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';
import { RestockStats } from '../../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { msIntervalFormatted, restockShopInfo } from '../../../utils/utils';
import { MdHelp } from 'react-icons/md';
import { IntervalFormatted } from '../../Utils/IntervalFormatted';

type StatsCardProps = {
  label?: string;
  stat?: string;
  helpText?: string;
  blur?: boolean;
  session: RestockStats;
  pastSession?: RestockStats | null;
  type: string;
};

type StatsInfo = {
  label: string;
  stat: string | React.ReactNode;
  helpText?: string;
  labelTooltip?: string;

  badgeTooltip?: string;
  badgeIconType?: 'up' | 'down';
  badgeColor?: string;
  badgeStat?: string;
};

export const StatsCard = (props: StatsCardProps) => {
  const {
    labelTooltip,
    label,
    stat,
    badgeStat,
    badgeIconType,
    badgeColor,
    helpText,
    badgeTooltip,
  } = useStatsTypes(props.type, props.session, props.pastSession);

  return (
    <Flex
      bg="blackAlpha.600"
      filter={props.blur ? 'blur(10px)' : undefined}
      // alignItems={'center'}
      borderRadius={'lg'}
      flexFlow={'column'}
      overflow={'hidden'}
    >
      <Flex pt={4} pb={1} px={3}>
        <Tooltip
          hasArrow
          isDisabled={!labelTooltip}
          label={labelTooltip}
          bg="blackAlpha.900"
          placement="top"
          fontSize={'xs'}
          color="white"
        >
          <Text color="whiteAlpha.700" fontSize={'xs'} cursor={'default'}>
            {label}
            {!!labelTooltip && <Icon as={MdHelp} verticalAlign={'middle'} ml={1} />}
          </Text>
        </Tooltip>
      </Flex>
      <Flex justifyContent={'space-between'} alignItems={'center'} flex={1} pb={4} px={3} gap={3}>
        <Text fontSize={'xl'} fontWeight={'semibold'}>
          {stat}
        </Text>
        {badgeStat && (
          <Tooltip
            hasArrow
            isDisabled={!badgeTooltip}
            label={badgeTooltip}
            bg="blackAlpha.900"
            fontSize={'xs'}
            placement="top"
            color="white"
          >
            <Badge
              colorScheme={badgeColor}
              p={1}
              borderRadius={'lg'}
              display="flex"
              alignItems={'center'}
            >
              <Icon as={badgeIconType === 'up' ? FaArrowTrendUp : FaArrowTrendDown} mr={1} />
              {badgeStat}
            </Badge>
          </Tooltip>
        )}
      </Flex>
      <Flex bg="blackAlpha.700" px={4} py={1} fontSize={'xs'} color="whiteAlpha.700">
        {helpText}
      </Flex>
    </Flex>
  );
};

const useStatsTypes = (
  type: string,
  sessionStats: RestockStats,
  pastSession?: RestockStats | null
): StatsInfo => {
  const t = useTranslations();
  const formatter = useFormatter();

  let badgeData = {};
  switch (type) {
    case 'reactionTime':
      if (pastSession) {
        const diff = sessionStats.avgReactionTime - pastSession.avgReactionTime;
        const diffPercentage = Math.abs(diff / pastSession.avgReactionTime) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(2)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'red' : 'green',
          badgeTooltip: t('Restock.from-x', {
            0: msIntervalFormatted(pastSession.avgReactionTime, true, 2),
          }),
        };
      }

      return {
        label: t('Restock.avg-reaction-time'),
        stat: <IntervalFormatted ms={sessionStats.avgReactionTime} long precision={2} />,
        helpText: t('Restock.based-on-x-clicks', {
          x: formatter.number(sessionStats.totalClicks),
        }),
        labelTooltip: t('Restock.avg-reaction-time-tooltip'),
        ...badgeData,
      };
    case 'bestBuy':
      return {
        label: t('Restock.most-expensive-item-bought'),
        stat: `${formatter.number(sessionStats.mostExpensiveBought?.price.value ?? 0)} NP`,
        helpText: sessionStats.mostExpensiveBought?.name ?? t('Restock.none'),
        ...badgeData,
      };
    case 'refreshTime':
      if (pastSession) {
        const diff = sessionStats.avgRefreshTime - pastSession.avgRefreshTime;
        const diffPercentage = Math.abs(diff / pastSession.avgRefreshTime) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(2)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'red' : 'green',
          badgeTooltip: t('Restock.from-x', {
            0: msIntervalFormatted(pastSession.avgRefreshTime, true, 2),
          }),
        };
      }
      return {
        label: t('Restock.avg-refresh-time'),
        stat: <IntervalFormatted ms={sessionStats.avgRefreshTime} long precision={2} />,
        helpText: t('Restock.based-on-x-refreshs', {
          x: formatter.number(sessionStats.totalRefreshes),
        }),
        ...badgeData,
      };
    case 'clickedAndLost':
      if (pastSession) {
        const diff = sessionStats.totalLost.value - pastSession.totalLost.value;
        const diffPercentage = Math.abs(diff / pastSession.totalLost.value) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(2)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'red' : 'green',
          badgeTooltip: t('Restock.from-x', {
            0: `${formatter.number(pastSession.totalLost.value)} NP`,
          }),
        };
      }

      return {
        label: t('Restock.total-clicked-and-lost'),
        stat: `${formatter.number(sessionStats.totalLost?.value ?? 0)} NP`,
        helpText: `${formatter.number(sessionStats.totalLost.count)} ${t(
          'General.items'
        ).toLowerCase()}`,
        ...badgeData,
      };
    case 'worstClickedAndLost':
      return {
        label: t('Restock.most-expensive-clicked-and-lost'),
        stat: `${formatter.number(sessionStats.mostExpensiveLost?.price.value ?? 0)} NP`,
        helpText: sessionStats.mostExpensiveLost?.name ?? t('Restock.none'),
        ...badgeData,
      };
    case 'fastestBuy':
      if (pastSession) {
        const diff =
          (sessionStats.fastestBuy?.timediff ?? 0) - (pastSession.fastestBuy?.timediff ?? 0);
        const diffPercentage = Math.abs(diff / (pastSession.fastestBuy?.timediff ?? 0)) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(2)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'red' : 'green',
          badgeTooltip: t('Restock.from-x', {
            0: msIntervalFormatted(pastSession.fastestBuy?.timediff ?? 0, true, 2),
          }),
        };
      }

      return {
        label: t('Restock.fastest-buy'),
        labelTooltip: t('Restock.fastest-buy-tooltip'),
        stat: <IntervalFormatted ms={sessionStats.fastestBuy?.timediff ?? 0} long precision={2} />,
        helpText: `${sessionStats.fastestBuy?.item.name ?? t('Restock.none')} ${t(
          'Restock.at'
        )} ${formatter.dateTime(sessionStats.fastestBuy?.timestamp ?? 0, {
          timeStyle: 'short',
          dateStyle: 'short',
          timeZone: 'America/Los_Angeles',
        })} NST`,
        ...badgeData,
      };
    case 'favoriteBuy':
      return {
        label: t('Restock.favorite-buy'),
        stat: `${sessionStats.favoriteItem.item?.name ?? t('Restock.none')}`,
        helpText: t('Restock.favorite-buy-tooltip', {
          0: formatter.number(sessionStats.favoriteItem.count),
        }),
        ...badgeData,
      };
    case 'timeSpent':
      if (pastSession) {
        const diff = sessionStats.durationCount - pastSession.durationCount;
        const diffPercentage = Math.abs(diff / pastSession.durationCount) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(2)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'green' : 'green',
          badgeTooltip: t('Restock.from-x', {
            0: msIntervalFormatted(pastSession.durationCount, true, 2),
          }),
        };
      }
      return {
        label: t('Restock.time-spent-restocking'),
        stat: msIntervalFormatted(sessionStats.durationCount, true, 2),
        helpText: `${msIntervalFormatted(sessionStats.mostPopularShop.durationCount, true, 2)} ${t(
          'Restock.at'
        )} ${restockShopInfo[sessionStats.mostPopularShop.shopId].name}`,
        ...badgeData,
      };
    case 'savedHaggling':
      if (pastSession) {
        const diff = sessionStats.totalHaggled - pastSession.totalHaggled;
        const diffPercentage = Math.abs(diff / pastSession.totalHaggled) * 100;

        badgeData = {
          badgeStat: `${diffPercentage.toFixed(0)}%`,
          badgeIconType: diff > 0 ? 'up' : 'down',
          badgeColor: diff > 0 ? 'green' : 'red',
          badgeTooltip: t('Restock.from-x', {
            0: `${formatter.number(pastSession.totalHaggled)} NP`,
          }),
        };
      }

      return {
        label: t('Restock.total-saved-haggling'),
        stat: `${formatter.number(sessionStats.totalHaggled ?? 0)} NP`,
        helpText: t('Restock.estimated-revenue-0', {
          0: `${formatter.number(sessionStats.estRevenue ?? 0)} NP`,
        }),
        ...badgeData,
      };
    default:
      return {
        label: 'Total Restocks',
        stat: '1',
        helpText: 'Total restocks made in this session',
      };
  }
};
