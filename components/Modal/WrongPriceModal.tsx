import {
  Alert,
  Box,
  Button,
  Center,
  CloseButton,
  Collapsible,
  Dialog,
  Flex,
  HStack,
  Icon,
  Link,
  Portal,
  RadioCard,
  Skeleton,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import axios from 'axios';
import { useState, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  LuArrowLeft,
  LuArrowRight,
  LuBookOpen,
  LuCalculator,
  LuChevronDown,
  LuCircleCheck,
  LuHistory,
  LuHourglass,
  LuInfo,
  LuPackageSearch,
  LuScale,
  LuTrendingUp,
} from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import { useAuth } from '@utils/auth';
import { MultiplyInput } from '@components/Input/MultiplyInput';
import type { ItemData, PriceData, PricingInfo } from '@types';

export type WrongPriceModalProps = {
  isOpen: boolean;
  item: ItemData;
  /** Latest price and the one before it (item page price list). */
  price?: PriceData;
  previousPrice?: PriceData;
  data?: PricingInfo;
  isLoading: boolean;
  onClose: () => void;
};

const DAY_MS = 1000 * 60 * 60 * 24;
/** "Very outdated" reason (and the outdated context card) only for prices at least this old. */
const OUTDATED_MIN_DAYS = 30;
/** A price this recent that moved at least 1.5x up or down shows the "just changed" card. */
const RECENT_CHANGE_DAYS = 3;
const BIG_CHANGE_UP = 1.5;
const BIG_CHANGE_DOWN = 0.67;

const PRICES_ARTICLE_HREF = '/articles/lets-talk-about-prices';

type ReportReason = 'calc-error' | 'very-outdated';
type Situation = 'no-price' | 'trades' | 'outdated' | 'changed' | 'up-to-date';

const SITUATION_STYLE: Record<Situation, { palette: string; icon: IconType }> = {
  'no-price': { palette: 'gray', icon: LuPackageSearch },
  trades: { palette: 'purple', icon: LuScale },
  outdated: { palette: 'orange', icon: LuHourglass },
  changed: { palette: 'blue', icon: LuTrendingUp },
  'up-to-date': { palette: 'green', icon: LuCircleCheck },
};

const REASONS: Record<ReportReason, { title: string; description: string; icon: IconType }> = {
  'calc-error': {
    title: 'ItemPage.wrong-price-reason-calc',
    description: 'ItemPage.wrong-price-reason-calc-txt',
    icon: LuCalculator,
  },
  'very-outdated': {
    title: 'ItemPage.wrong-price-reason-outdated',
    description: 'ItemPage.wrong-price-reason-outdated-txt',
    icon: LuHistory,
  },
};

function getSituation(
  price: PriceData | undefined,
  previousPrice: PriceData | undefined,
  data: PricingInfo | undefined,
  ageDays: number
): Situation {
  if (!price?.value) return 'no-price';
  if (data && data.waitingTrades.needPricing + data.waitingTrades.needVoting > 0) return 'trades';
  if (ageDays >= OUTDATED_MIN_DAYS) return 'outdated';

  const ratio = previousPrice?.value ? price.value / previousPrice.value : 1;
  if (ageDays < RECENT_CHANGE_DAYS && (ratio >= BIG_CHANGE_UP || ratio <= BIG_CHANGE_DOWN))
    return 'changed';

  return 'up-to-date';
}

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link asChild color="blue.200" textDecoration="underline" textUnderlineOffset="2px">
      <MainLink href={href} prefetch={false}>
        {children}
      </MainLink>
    </Link>
  );
}

function ExternalLink({ href, children }: { href?: string | null; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      color="blue.200"
      textDecoration="underline"
      textUnderlineOffset="2px"
    >
      {children}
    </Link>
  );
}

export default function WrongPriceModal(props: WrongPriceModalProps) {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow();
  const { user } = useAuth();
  const { isOpen, onClose, item, price, previousPrice, data, isLoading } = props;

  const [step, setStep] = useState<'info' | 'report'>('info');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tradesHref = `/feedback/trades?target=${item.name}`;
  const voteHref = `/feedback/vote?target=${item.name}`;

  const priceDate = price?.addedAt ? new Date(price.addedAt) : null;
  const ageDays = priceDate ? (now.getTime() - priceDate.getTime()) / DAY_MS : 0;
  const situation = getSituation(price, previousPrice, data, ageDays);
  const canReport = !!price?.value;
  const canReportOutdated = ageDays >= OUTDATED_MIN_DAYS;
  const updatedAgo = priceDate ? format.relativeTime(priceDate, now) : '';

  const sendReport = async () => {
    if (!reason) return;
    setIsSending(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        subject_id: item.internal_id,
        json: JSON.stringify({
          message: 'User cried for help',
          reason,
          suggestedPrice,
        }),
        user_id: user?.id,
        type: 'priceReport',
        pageInfo: `${window.location.pathname}${window.location.search}`,
      });

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const situationText = (): { title: string; text: ReactNode } => {
    switch (situation) {
      case 'no-price':
        return {
          title: t('ItemPage.wrong-price-no-price-title'),
          text: t('ItemPage.wrong-price-no-price-txt'),
        };
      case 'trades':
        return {
          title: t('ItemPage.wrong-price-trades-title'),
          text: t('ItemPage.wrong-price-trades-txt', {
            pricing: data?.waitingTrades.needPricing ?? 0,
            voting: data?.waitingTrades.needVoting ?? 0,
          }),
        };
      case 'outdated':
        return {
          title: t('ItemPage.wrong-price-outdated-title', { days: Math.floor(ageDays) }),
          text: t.rich('ItemPage.wrong-price-outdated-txt', {
            SW: (chunk) => <ExternalLink href={item.findAt.shopWizard}>{chunk}</ExternalLink>,
            Script: (chunk) => <InlineLink href="/contribute">{chunk}</InlineLink>,
          }),
        };
      case 'changed':
        return {
          title: t('ItemPage.wrong-price-changed-title'),
          text: t('ItemPage.wrong-price-changed-txt', {
            time: updatedAgo,
            from: format.number(previousPrice?.value ?? 0),
            to: format.number(price?.value ?? 0),
          }),
        };
      default:
        return {
          title: t('ItemPage.wrong-price-up-to-date-title'),
          text: t('ItemPage.wrong-price-up-to-date-txt', { time: updatedAgo }),
        };
    }
  };

  const renderSituationCard = () => {
    // the trades card depends on the status request
    if (isLoading && situation !== 'no-price') return <Skeleton height="88px" borderRadius="md" />;

    const { palette, icon } = SITUATION_STYLE[situation];
    const { title, text } = situationText();

    return (
      <Alert.Root variant="subtle" colorPalette={palette} borderRadius="md" size="sm">
        <Alert.Indicator>
          <Icon as={icon} />
        </Alert.Indicator>
        <Alert.Content gap={2}>
          <Alert.Title fontSize="sm">{title}</Alert.Title>
          <Alert.Description fontSize="xs" color="whiteAlpha.800">
            {text}
          </Alert.Description>
          {situation === 'trades' && (
            <HStack gap={2} flexWrap="wrap">
              <Button asChild size="xs" variant="subtle" colorPalette="whiteAlpha">
                <MainLink href={tradesHref} prefetch={false}>
                  {t('Feedback.price-trade-lots')}
                </MainLink>
              </Button>
              <Button asChild size="xs" variant="subtle" colorPalette="whiteAlpha">
                <MainLink href={voteHref} prefetch={false}>
                  {t('Feedback.vote-suggestions')}
                </MainLink>
              </Button>
            </HStack>
          )}
          {situation === 'no-price' && (
            <HStack>
              <Button asChild size="xs" variant="subtle" colorPalette="whiteAlpha">
                <MainLink href="/contribute">
                  {t('ItemPage.wrong-price-install-extractor')}
                </MainLink>
              </Button>
            </HStack>
          )}
        </Alert.Content>
      </Alert.Root>
    );
  };

  const renderHowToHelp = () => (
    <Box bg="blackAlpha.300" borderRadius="md" px={3} py={2.5}>
      <Text fontSize="xs" fontWeight="semibold" mb={1.5}>
        {t('ItemPage.wrong-price-help-title')}
      </Text>
      <Stack as="ol" gap={1} ps={4} listStyleType="decimal" fontSize="xs" color="whiteAlpha.800">
        <li>
          {t.rich('ItemPage.wrongPrice-2', {
            Link: (chunk) => <InlineLink href="/contribute">{chunk}</InlineLink>,
          })}
        </li>
        <li>
          {t('ItemPage.wrongPrice-3')}
          <Text fontSize="2xs" color="whiteAlpha.600">
            {t('ItemPage.wrongPrice-4')}
          </Text>
        </li>
        <li>
          {t.rich('ItemPage.wrongPrice-5', {
            Link1: (chunk) => <InlineLink href={tradesHref}>{chunk}</InlineLink>,
            Link2: (chunk) => <InlineLink href={voteHref}>{chunk}</InlineLink>,
          })}
        </li>
        <li>{t('ItemPage.wrongPrice-7')}</li>
      </Stack>
    </Box>
  );

  const renderDataDetails = () => {
    const rows: { label: ReactNode; help: string; value?: number }[] = [
      {
        label: t('ItemPage.fresh-data'),
        help: t('ItemPage.fresh-data-txt'),
        value: data?.dataStatus.fresh,
      },
      {
        label: t('ItemPage.old-data'),
        help: t('ItemPage.old-data-txt'),
        value: data?.dataStatus.old,
      },
      {
        label: <InlineLink href={tradesHref}>{t('ItemPage.waiting-pricing')}</InlineLink>,
        help: t('ItemPage.waiting-trades-txt'),
        value: data?.waitingTrades.needPricing,
      },
      {
        label: <InlineLink href={voteHref}>{t('ItemPage.waiting-votes')}</InlineLink>,
        help: t('ItemPage.waiting-votes-txt'),
        value: data?.waitingTrades.needVoting,
      },
    ];

    return (
      <Collapsible.Root>
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            size="xs"
            w="100%"
            justifyContent="space-between"
            color="whiteAlpha.700"
          >
            <HStack gap={1.5}>
              <LuInfo /> {t('ItemPage.wrong-price-how-calculated')}
            </HStack>
            <Collapsible.Indicator
              transition="transform 0.15s"
              _open={{ transform: 'rotate(180deg)' }}
            >
              <LuChevronDown />
            </Collapsible.Indicator>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Stack gap={2} bg="blackAlpha.300" borderRadius="md" p={3} mt={1}>
            {isLoading && (
              <Center>
                <Spinner size="sm" />
              </Center>
            )}
            {!isLoading &&
              rows.map((row) => (
                <Flex key={row.help} justifyContent="space-between" gap={3}>
                  <Box>
                    <Text fontSize="xs">{row.label}</Text>
                    <Text fontSize="2xs" color="whiteAlpha.600">
                      {row.help}
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="semibold">
                    {row.value ?? 0}
                  </Text>
                </Flex>
              ))}
            <Text fontSize="2xs" color="whiteAlpha.600" mt={1}>
              {t.rich('ItemPage.algorithm-txt', {
                b: (chunk) => <b>{chunk}</b>,
              })}
            </Text>
            <Text fontSize="2xs" color="whiteAlpha.600">
              {t('ItemPage.algorithm-txt2')}
            </Text>
            <HStack gap={1.5} fontSize="xs">
              <LuBookOpen />
              <InlineLink href={PRICES_ARTICLE_HREF}>{t('ItemPage.how-do-prices-work')}</InlineLink>
            </HStack>
          </Stack>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  };

  const renderReasonPicker = () => (
    <RadioCard.Root
      size="sm"
      variant="surface"
      colorPalette="gray"
      orientation="horizontal"
      align="start"
      value={reason}
      disabled={isSuccess}
      onValueChange={({ value }) => value && setReason(value as ReportReason)}
    >
      <Stack gap={2}>
        {(Object.keys(REASONS) as ReportReason[]).map((key) => {
          const option = REASONS[key];
          const disabled = key === 'very-outdated' && !canReportOutdated;
          return (
            <RadioCard.Item key={key} value={key} disabled={disabled} w="100%">
              <RadioCard.ItemHiddenInput />
              <RadioCard.ItemControl py={2} px={3} cursor={disabled ? 'not-allowed' : 'pointer'}>
                <Icon as={option.icon} boxSize="16px" mt={0.5} color="whiteAlpha.700" />
                <RadioCard.ItemContent>
                  <RadioCard.ItemText fontSize="sm">{t(option.title)}</RadioCard.ItemText>
                  <RadioCard.ItemDescription fontSize="xs">
                    {disabled
                      ? t('ItemPage.wrong-price-reason-outdated-disabled', {
                          days: OUTDATED_MIN_DAYS,
                        })
                      : t(option.description)}
                  </RadioCard.ItemDescription>
                </RadioCard.ItemContent>
                <RadioCard.ItemIndicator />
              </RadioCard.ItemControl>
            </RadioCard.Item>
          );
        })}
      </Stack>
    </RadioCard.Root>
  );

  const isReportStep = step === 'report' && canReport;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {isReportStep
                  ? t('ItemPage.wrong-price-report-title')
                  : t('ItemPage.wrong-price-about-title')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize="sm">
              {!isReportStep && (
                <Stack gap={3}>
                  {renderSituationCard()}
                  {renderHowToHelp()}
                  {renderDataDetails()}
                  {canReport && (
                    <Button
                      variant="plain"
                      size="xs"
                      alignSelf="center"
                      color="whiteAlpha.700"
                      _hover={{ color: 'white' }}
                      onClick={() => setStep('report')}
                    >
                      {t('ItemPage.wrong-price-report-link')} <LuArrowRight />
                    </Button>
                  )}
                </Stack>
              )}

              {isReportStep && (
                <Stack gap={3}>
                  <Button
                    variant="ghost"
                    size="xs"
                    alignSelf="flex-start"
                    color="whiteAlpha.700"
                    onClick={() => setStep('info')}
                  >
                    <LuArrowLeft /> {t('ItemPage.wrong-price-back')}
                  </Button>
                  <HStack
                    justifyContent="space-between"
                    bg="blackAlpha.300"
                    borderRadius="md"
                    px={3}
                    py={2}
                    gap={3}
                  >
                    <Text fontSize="xs" color="whiteAlpha.700">
                      {t('ItemPage.wrong-price-current-price')}
                    </Text>
                    <Text fontSize="xs" fontWeight="semibold" textAlign="right">
                      {format.number(price?.value ?? 0)} NP · {updatedAgo}
                    </Text>
                  </HStack>
                  {isSuccess ? (
                    <HStack
                      gap={2}
                      bg="green.900"
                      color="green.100"
                      borderRadius="md"
                      px={3}
                      py={2}
                    >
                      <LuCircleCheck /> <Text>{t('ItemPage.thank-you-for-your-report')}</Text>
                    </HStack>
                  ) : (
                    <>
                      <Text fontSize="xs" color="whiteAlpha.700">
                        {t('ItemPage.wrong-price-what-wrong')}
                      </Text>
                      {renderReasonPicker()}
                      <MultiplyInput
                        onChange={setSuggestedPrice}
                        wrapperProps={{
                          variant: 'filled',
                          bg: 'whiteAlpha.200',
                          borderRadius: 'md',
                          size: 'sm',
                        }}
                        inputProps={{
                          variant: 'filled',
                          placeholder: t('ItemPage.wrong-price-suggested-optional'),
                          pl: 3,
                          _placeholder: { color: 'whiteAlpha.600' },
                        }}
                      />
                    </>
                  )}
                </Stack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {isReportStep && !isSuccess && (
                <Button size="sm" disabled={!reason} loading={isSending} onClick={sendReport}>
                  {t('ItemPage.wrong-price-send-report')}
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} size="sm">
                {t('General.close')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
