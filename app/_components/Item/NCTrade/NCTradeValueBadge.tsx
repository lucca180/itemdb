import { Badge, Link, Stat, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function NCTradeValueBadge({ item }: Props) {
  const t = await getTranslations();

  return (
    <Badge
      colorPalette={item.ncValue && item.ncValue.source === 'lebron' ? 'yellow' : 'purple'}
      fontSize="xs"
      minW="15%"
      maxW={{ base: '100%', md: '25%' }}
      whiteSpace="normal"
      textTransform="initial"
      alignSelf="center"
      borderRadius="md"
      textAlign="center"
    >
      <Stat.Root flex="initial" justifyContent="center" alignItems="center" w="full">
        <Stat.Label fontSize="xs">
          {!item.ncValue && t('ItemPage.nc-guide-value')}
          {item.ncValue?.source === 'itemdb' && t('ItemPage.itemdb-value')}
          {item.ncValue?.source === 'lebron' && (
            <Link asChild target="_blank" rel="noreferrer">
              <I18nLink href="/articles/lebron" target="_blank">
                {t('ItemPage.lebron-value')}
              </I18nLink>
            </Link>
          )}
        </Stat.Label>
        {!item.ncValue && (
          <>
            <Stat.ValueText mb={0}>???</Stat.ValueText>
            <Text fontSize="xs" as="span">
              {t('ItemPage.no-enough-data')}
            </Text>
            <Stat.HelpText fontSize="xs" mt={1} mb={0} fontWeight="medium" opacity={1}>
              <Link asChild target="_blank" rel="noreferrer">
                <I18nLink href="/mall/report" target="_blank">
                  {t('ItemPage.report-your-nc-trades')}
                </I18nLink>
              </Link>
            </Stat.HelpText>
          </>
        )}
        {item.ncValue && (
          <>
            <Stat.ValueText mb={0}>
              {item.ncValue.range}
              <Text fontSize="xs" as="span">
                {' '}
                caps
              </Text>
            </Stat.ValueText>
            <Stat.HelpText fontSize="xs" mb={0} color="yellow.200">
              {format(new Date(item.ncValue.addedAt), 'PP')}{' '}
            </Stat.HelpText>
          </>
        )}
      </Stat.Root>
    </Badge>
  );
}
