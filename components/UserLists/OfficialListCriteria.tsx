import type { ReactNode } from 'react';
import { Heading, Link, List, Stack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { BsCheckCircleFill } from 'react-icons/bs';
import { Link as I18nLink } from '@i18n/navigation';

type Props = {
  /** Short checklist only, for the apply modal. The contribute page shows the full version. */
  compact?: boolean;
};

// usefulness first: it's the main bar, not every list can become official
const CRITERIA = [
  'Lists.official-criteria-topic',
  'Lists.official-criteria-public',
  'Lists.official-criteria-unique',
] as const;

const CRITERIA_SHORT = [
  'Lists.official-criteria-topic-short',
  'Lists.official-criteria-public-short',
  'Lists.official-criteria-unique',
] as const;

/**
 * Official list criteria + what the curator gets/commits to.
 * Shared by the contribute page (official tab) and the apply modal, so both always match.
 */
export default function OfficialListCriteria({ compact = false }: Props) {
  const t = useTranslations();
  const b = (chunk: ReactNode) => <b>{chunk}</b>;

  // the check icon is the marker: no list dots, wrapped lines align with the text
  const criteriaList = (
    <List.Root gap={2} listStyle="none" fontSize={compact ? 'sm' : undefined}>
      {(compact ? CRITERIA_SHORT : CRITERIA).map((key) => (
        <List.Item key={key} display="flex" alignItems="flex-start">
          <List.Indicator asChild color="green.300">
            <BsCheckCircleFill />
          </List.Indicator>
          <Text as="span">{t.rich(key, { b })}</Text>
        </List.Item>
      ))}
    </List.Root>
  );

  if (compact) return criteriaList;

  return (
    <Stack gap={3}>
      <Heading size="md">{t('Lists.official-criteria-title')}</Heading>
      {criteriaList}
      <Heading size="md" mt={1}>
        {t('Lists.official-you-get-title')}
      </Heading>
      <Text>{t.rich('Lists.official-you-get', { b })}</Text>
      <Heading size="md" mt={1}>
        {t('Lists.official-you-commit-title')}
      </Heading>
      <Text>
        {t.rich('Lists.official-you-commit', {
          b,
          Link: (chunk) => (
            <Link asChild color="green.200">
              <I18nLink href="/terms" target="_blank">
                {chunk}
              </I18nLink>
            </Link>
          ),
        })}
      </Text>
    </Stack>
  );
}
