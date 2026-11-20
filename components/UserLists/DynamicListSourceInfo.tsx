import { Button, Icon, Link, Text } from '@chakra-ui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import { LuSearch, LuTriangleAlert } from 'react-icons/lu';
import NextImage from 'next/image';
import DynamicIcon from '@assets/icons/dynamic.png';
import MainLink from '@components/Utils/MainLink';
import type { DynamicListSource } from '@types';

const JUST_NOW_MS = 60 * 1000;

type DynamicListSourceInfoProps = {
  source?: DynamicListSource | null;
  lastSync: string | null;
  /** Owner who hid the checklist progress: this is the way to bring it back */
  onShowProgress?: () => void;
};

const SourceLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link asChild fontWeight="semibold" color="orange.200">
    <MainLink href={href} trackEvent="dynamic-list-source">
      {children} <Icon as={BiLinkExternal} verticalAlign="text-top" />
    </MainLink>
  </Link>
);

/** Continues the "by X" line of the list header, so it only renders inline elements. */
export function DynamicListSourceInfo({
  source,
  lastSync,
  onShowProgress,
}: DynamicListSourceInfoProps) {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow();

  const getSourceIcon = () => {
    if (source?.type === 'deleted') {
      return <Icon as={LuTriangleAlert} mr={1} verticalAlign="text-top" />;
    }
    if (source?.type === 'search') {
      return <Icon as={LuSearch} boxSize="12px" mr={1} verticalAlign="-0.1em" />;
    }

    return (
      <NextImage
        src={DynamicIcon}
        alt=""
        width={10}
        height={10}
        style={{ display: 'inline-block', marginRight: 4 }}
      />
    );
  };

  const getSourceText = () => {
    if (!source) return null;
    if (source.type === 'deleted') return t('Lists.source-deleted');
    if (source.type === 'privateList') return t('Lists.follows-private-list');
    if (source.type === 'search') return t('Lists.follows-a-search');

    return t.rich('Lists.follows-list', {
      name: source.name,
      Link: (chunk) => <SourceLink href={source.href}>{chunk}</SourceLink>,
    });
  };

  const getSyncText = () => {
    if (!lastSync) return null;

    const syncDate = new Date(lastSync);
    if (now.getTime() - syncDate.getTime() < JUST_NOW_MS) return t('Lists.synced-just-now');

    return t('Lists.synced-x', { x: format.relativeTime(syncDate, now) });
  };

  const isDeleted = source?.type === 'deleted';
  const sourceText = getSourceText();
  const syncText = getSyncText();

  return (
    <>
      {sourceText && (
        <>
          {' '}
          •{' '}
          <Text as="span" color={isDeleted ? 'yellow.300' : undefined}>
            {getSourceIcon()}
            {sourceText}
          </Text>
        </>
      )}
      {syncText && (
        <>
          {' '}
          •{' '}
          <Text as="span" color="whiteAlpha.700">
            {syncText}
          </Text>
        </>
      )}
      {onShowProgress && (
        <>
          {' '}
          •{' '}
          <Button
            variant="plain"
            size="xs"
            h="auto"
            minW={0}
            p={0}
            fontSize="inherit"
            fontWeight="normal"
            verticalAlign="baseline"
            color="whiteAlpha.700"
            textDecoration="underline"
            onClick={onShowProgress}
            data-umami-event="checklist-progress-toggle"
            data-umami-event-label="show"
          >
            {t('Lists.show-progress')}
          </Button>
        </>
      )}
    </>
  );
}
