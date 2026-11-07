import {
  Alert,
  Box,
  Button,
  Center,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Icon,
  Image,
  Input,
  List,
  NativeSelect,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import NextImage from 'next/image';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  LuArrowRight,
  LuCheck,
  LuCircleCheck,
  LuEyeOff,
  LuInfo,
  LuList,
  LuMinus,
  LuPlus,
  LuSearch,
  LuX,
} from 'react-icons/lu';
import DynamicIcon from '@assets/icons/dynamic.png';
import MainLink from '@components/Utils/MainLink';
import type { DynamicListTypes, UserList } from '@types';
import { useAuth } from '@utils/auth';
import { isChecklist, useDynamicListLabels } from '@utils/list/dynamicListLabels';
import { useLists } from '@utils/useLists';
import {
  DYNAMIC_LIST_ACCENT,
  DYNAMIC_LIST_ACCENT_LIGHT,
} from '@app/[locale]/tools/price-checker/priceCheckerTheme';

const MAX_ITEMS = 4000;

const IMG = 'https://images.neopets.com/items';

// only illustrates what a sync does: not related to the list being created
const SIM_IMAGES = {
  a: `${IMG}/sta_queen_fyora.gif`,
  b: `${IMG}/sta_sloth_charm.gif`,
  c: `${IMG}/toy_faerie_grey.gif`,
  d: `${IMG}/toy_faerie_siyana.gif`,
  e: `${IMG}/toy_bobble_abominable.gif`,
};

type SimItem = keyof typeof SIM_IMAGES;

/** What the next sync does when `e` enters the source and `d` leaves it (see `syncDynamicList`). */
const SIM_RESULT: Record<DynamicListTypes, SimItem[]> = {
  fullSync: ['a', 'b', 'c', 'e'],
  search: ['a', 'b', 'c', 'e'],
  addOnly: ['a', 'b', 'c', 'd', 'e'],
  removeOnly: ['a', 'b', 'c'],
};

const RULE_TONES = {
  yes: { icon: LuCheck, color: 'green.300' },
  no: { icon: LuX, color: 'gray.500' },
  hide: { icon: LuEyeOff, color: 'orange.300' },
};

const FULL_SYNC_RULES = [
  { tone: 'yes', key: 'rule-new-added' },
  { tone: 'yes', key: 'rule-gone-removed' },
  { tone: 'no', key: 'rule-no-manual-add' },
  { tone: 'hide', key: 'rule-no-remove' },
] as const;

const RULES = {
  fullSync: FULL_SYNC_RULES,
  search: FULL_SYNC_RULES,
  addOnly: [
    { tone: 'yes', key: 'rule-new-added' },
    { tone: 'no', key: 'rule-gone-kept' },
    { tone: 'yes', key: 'rule-manual-add' },
    { tone: 'hide', key: 'rule-no-remove-source' },
  ],
  removeOnly: [
    { tone: 'no', key: 'rule-new-not-added' },
    { tone: 'yes', key: 'rule-gone-removed' },
    { tone: 'no', key: 'rule-no-manual-add' },
    { tone: 'yes', key: 'rule-manual-remove' },
  ],
} as const;

export type CreateDynamicListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  source: 'list' | 'search';
  sourceTitle: string;
  sourceByline: string;
  sourceImage?: string | null;
  itemCount?: number;
  defaultMode: DynamicListTypes;
  defaultName: string;
  /** Sent when creating the list, on top of the name and visibility chosen here */
  newListData: Record<string, unknown>;
  /** Sent to the dynamic endpoint: what the new list follows */
  dynamicData: Record<string, unknown>;
  onLoginRequired: () => void;
  trackProps: Record<string, string>;
  /** When set the caller takes over after creating, so there's no final step */
  onCreate?: (newList: UserList, mode: DynamicListTypes) => void;
  /** The source can back a Goal Counter */
  showGoalStep?: boolean;
};

const CreateDynamicListDialog = (props: CreateDynamicListDialogProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { user } = useAuth();
  const { revalidate } = useLists();
  const { getNoun, getModeName } = useDynamicListLabels();
  const {
    isOpen,
    onClose,
    source,
    sourceTitle,
    sourceByline,
    sourceImage,
    itemCount,
    defaultMode,
    defaultName,
    newListData,
    dynamicData,
    onLoginRequired,
    trackProps,
    onCreate,
    showGoalStep,
  } = props;

  const [mode, setMode] = useState<DynamicListTypes>(defaultMode);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(defaultName);
  const [visibility, setVisibility] = useState<UserList['visibility']>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [created, setCreated] = useState<UserList | null>(null);

  const listInfo = { dynamicType: mode, official: false };
  const noun = getNoun(listInfo);
  const count = itemCount ?? 0;
  const isOverLimit = count > MAX_ITEMS && !(source === 'search' && mode === 'search');
  const isNumericName = /^\d+$/.test(name.trim());
  const modes: DynamicListTypes[] = ['fullSync', 'addOnly', 'removeOnly'];
  if (user?.isAdmin) modes.push('search');

  const goToNameStep = () => {
    if (!user) {
      onClose();
      onLoginRequired();
      return;
    }

    window.umami?.track('dynamic-list-next', { ...trackProps, type: mode });
    setStep(2);
  };

  const createList = async () => {
    if (!user) return;

    window.umami?.track('dynamic-list-confirm', { ...trackProps, type: mode });

    setLoading(true);
    setError(false);
    let newList: UserList | null = null;

    try {
      const res = await axios.post(`/api/v1/lists/${user.username}`, {
        ...newListData,
        name: name.trim(),
        visibility,
        purpose: 'none',
      });

      if (!res.data.success) throw new Error(res.data.message);
      newList = res.data.message as UserList;

      await axios.post(`/api/v1/lists/${user.username}/${newList.internal_id}/dynamic`, {
        ...dynamicData,
        dynamicType: mode,
      });

      revalidate();

      if (!onCreate) {
        setCreated(newList);
        return;
      }

      onCreate(newList, mode);
      toast({
        id: 'dynamic-list-created',
        title: isChecklist(listInfo)
          ? t('DynamicList.created-checklist')
          : t('DynamicList.created-dynamic'),
        status: 'success',
        duration: 5000,
      });
      onClose();
    } catch (e) {
      console.error(e);
      setError(true);

      // the list exists but isn't dynamic: don't leave an empty list behind
      if (newList) {
        await axios
          .delete(`/api/v1/lists/${user.username}`, { data: { listIds: [newList.internal_id] } })
          .catch(console.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const doClose = () => {
    if (loading) return;
    onClose();
  };

  const primaryProps = {
    bg: DYNAMIC_LIST_ACCENT,
    color: 'gray.900',
    _hover: { opacity: 0.9 },
  };

  const newListHref = created
    ? `/lists/${user?.username}/${created.slug ?? created.internal_id}`
    : '';

  let body: ReactNode;
  let footer: ReactNode;

  if (created) {
    const nextSteps = isChecklist(listInfo)
      ? [
          { key: 'hide', href: '/lists/import', icon: LuEyeOff, content: 'dyn-2' },
          ...(showGoalStep
            ? [{ key: 'goal', href: newListHref, icon: LuCircleCheck, content: 'dyn-3' }]
            : []),
        ]
      : [];

    body = (
      <Flex direction="column" gap={4}>
        <Flex gap={3} align="center">
          <Icon as={LuCircleCheck} boxSize="28px" color="green.300" flexShrink={0} />
          <Box minW={0}>
            <Text fontWeight="semibold" truncate>
              {created.name}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {t('DynamicList.created-summary')}
            </Text>
          </Box>
        </Flex>
        {nextSteps.length > 0 && (
          <Flex direction="column" gap={2}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400">
              {t('DynamicList.next-steps')}
            </Text>
            {nextSteps.map((nextStep) => (
              <Box key={nextStep.key} onClick={onClose}>
                <MainLink
                  viaNextLink
                  prefetch={false}
                  href={nextStep.href}
                  trackEvent="dynamic-list-next-step"
                  trackEventLabel={nextStep.key}
                >
                  <Flex
                    gap={3}
                    p={3}
                    borderRadius="md"
                    bg="blackAlpha.300"
                    align="flex-start"
                    _hover={{ bg: 'blackAlpha.400' }}
                  >
                    <Icon
                      as={nextStep.icon}
                      color={DYNAMIC_LIST_ACCENT_LIGHT}
                      mt="2px"
                      flexShrink={0}
                    />
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold">
                        {nextStep.content === 'dyn-2'
                          ? t('ImportPage.dyn-2-title')
                          : t('ImportPage.dyn-3-title')}
                      </Text>
                      <Text as="div" fontSize="xs" color="gray.400">
                        {nextStep.content === 'dyn-2'
                          ? t.rich('ImportPage.dyn-2', { b: (chunks) => <b>{chunks}</b> })
                          : t.rich('ImportPage.dyn-3', { b: (chunks) => <b>{chunks}</b> })}
                      </Text>
                    </Box>
                  </Flex>
                </MainLink>
              </Box>
            ))}
          </Flex>
        )}
      </Flex>
    );

    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>
          {t('General.close')}
        </Button>
        <Box onClick={onClose}>
          <Button asChild {...primaryProps}>
            <MainLink
              viaNextLink
              prefetch={false}
              href={newListHref}
              trackEvent="dynamic-list-open"
              trackEventLabel={mode}
            >
              {t('DynamicList.open-list', { noun })}
              <LuArrowRight />
            </MainLink>
          </Button>
        </Box>
      </>
    );
  } else if (loading) {
    body = (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  } else if (error) {
    body = (
      <Text color="red.300" textAlign="center">
        {t('General.something-went-wrong')}
      </Text>
    );

    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>
          {t('General.close')}
        </Button>
        <Button variant="ghost" onClick={() => setError(false)}>
          {t('General.back')}
        </Button>
      </>
    );
  } else if (step === 1) {
    body = (
      <Flex direction="column" gap={4}>
        <SourceCard
          source={source}
          title={sourceTitle}
          byline={sourceByline}
          image={sourceImage}
          itemCount={itemCount}
        />
        {isOverLimit && (
          <Alert.Root size="sm" status="warning" borderRadius="md">
            <Alert.Indicator />
            <Alert.Title fontWeight="normal">
              {t(
                source === 'list' ? 'DynamicList.over-limit-list' : 'DynamicList.over-limit-search',
                {
                  count,
                  max: MAX_ITEMS,
                }
              )}
            </Alert.Title>
          </Alert.Root>
        )}
        <Flex
          gap={1}
          p={1}
          borderRadius="md"
          bg="blackAlpha.300"
          role="group"
          aria-label={t('DynamicList.mode-label')}
        >
          {modes.map((value) => (
            <Button
              key={value}
              size="xs"
              flex="1"
              px={1}
              aria-pressed={value === mode}
              variant={value === mode ? 'solid' : 'ghost'}
              bg={value === mode ? DYNAMIC_LIST_ACCENT : undefined}
              color={value === mode ? 'gray.900' : undefined}
              onClick={() => setMode(value)}
            >
              {getModeName(value)}
            </Button>
          ))}
        </Flex>
        <SyncSimulation source={source} mode={mode} />
        <List.Root variant="plain" gap={1.5}>
          {RULES[mode].map((rule) => {
            const tone = RULE_TONES[rule.tone];
            return (
              <List.Item key={rule.key} fontSize="xs" color="gray.300" alignItems="flex-start">
                <List.Indicator asChild color={tone.color} mt="2px">
                  <tone.icon />
                </List.Indicator>
                {t(`DynamicList.${rule.key}`, { source })}
              </List.Item>
            );
          })}
        </List.Root>
      </Flex>
    );

    footer = (
      <>
        <Button variant="ghost" onClick={doClose}>
          {t('General.cancel')}
        </Button>
        <Button {...primaryProps} disabled={isOverLimit} onClick={goToNameStep}>
          {t('General.next')}
          <LuArrowRight />
        </Button>
      </>
    );
  } else {
    body = (
      <Flex direction="column" gap={4}>
        <SourceCard
          source={source}
          title={sourceTitle}
          byline={sourceByline}
          image={sourceImage}
          itemCount={itemCount}
        />
        <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root flex="1" invalid={isNumericName}>
            <Field.Label fontSize="xs" color="gray.300">
              {t('General.name')}
            </Field.Label>
            <Input
              size="sm"
              variant="subtle"
              value={name}
              placeholder={t('DynamicList.name-placeholder')}
              onChange={(e) => setName(e.target.value)}
            />
            <Field.ErrorText fontSize="xs">{t('DynamicList.name-number-error')}</Field.ErrorText>
          </Field.Root>
          <Field.Root w={{ base: '100%', sm: '130px' }} flexShrink={0}>
            <Field.Label fontSize="xs" color="gray.300">
              {t('General.visibility')}
            </Field.Label>
            <NativeSelect.Root size="sm" variant="subtle">
              <NativeSelect.Field
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as UserList['visibility'])}
              >
                <option value="public">{t('General.public')}</option>
                <option value="unlisted">{t('General.unlisted')}</option>
                <option value="private">{t('General.private')}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </Flex>
        <Flex gap={2} align="center" fontSize="sm">
          <Text color="gray.400">{t('DynamicList.mode-label')}:</Text>
          <Text fontWeight="semibold" color={DYNAMIC_LIST_ACCENT_LIGHT}>
            {getModeName(mode)}
          </Text>
        </Flex>
        <Flex gap={2} fontSize="xs" color="gray.400" align="flex-start">
          <Icon as={LuInfo} mt="2px" flexShrink={0} />
          <Text>{t('DynamicList.permanent-note', { source })}</Text>
        </Flex>
      </Flex>
    );

    footer = (
      <>
        <Button variant="ghost" onClick={() => setStep(1)}>
          {t('General.back')}
        </Button>
        <Button {...primaryProps} disabled={isNumericName} onClick={createList}>
          {t('General.create')} {noun}
        </Button>
      </>
    );
  }

  return (
    <Dialog.Root
      open={isOpen}
      placement="center"
      closeOnEscape={!loading}
      closeOnInteractOutside={!loading}
      onOpenChange={(details) => {
        if (!details.open) doClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header display="flex" alignItems="center" gap={2}>
              <NextImage src={DynamicIcon} alt="" width={14} style={{ display: 'inline' }} />
              <Dialog.Title>
                {created
                  ? isChecklist(listInfo)
                    ? t('DynamicList.created-checklist')
                    : t('DynamicList.created-dynamic')
                  : `${t('General.create')} ${noun}`}
              </Dialog.Title>
              {!created && !loading && !error && (
                <Text fontSize="xs" color="gray.500" ml="auto" mr={8}>
                  {t('DynamicList.step', { step })}
                </Text>
              )}
            </Dialog.Header>
            {!loading && (
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            )}
            <Dialog.Body>{body}</Dialog.Body>
            {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

type SourceCardProps = {
  source: CreateDynamicListDialogProps['source'];
  title: string;
  byline: string;
  image?: string | null;
  itemCount?: number;
};

const SourceCard = ({ source, title, byline, image, itemCount }: SourceCardProps) => {
  const t = useTranslations();

  return (
    <Flex
      gap={3}
      align="center"
      p={3}
      borderRadius="md"
      bg="blackAlpha.300"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      {image ? (
        <Image src={image} alt="" boxSize="34px" borderRadius="md" objectFit="cover" />
      ) : (
        <Flex boxSize="34px" flexShrink={0} align="center" justify="center" color="gray.300">
          <Icon as={source === 'list' ? LuList : LuSearch} boxSize="20px" />
        </Flex>
      )}
      <Box minW={0} flex="1">
        <Text fontSize="sm" fontWeight="semibold" truncate>
          {title}
        </Text>
        <Text fontSize="xs" color="gray.400">
          {byline}
          {itemCount !== undefined && ` · ${t('DynamicList.source-items', { count: itemCount })}`}
        </Text>
      </Box>
    </Flex>
  );
};

const SimTile = ({ item, state }: { item: SimItem; state?: 'added' | 'removed' }) => (
  <Box position="relative" flexShrink={0}>
    <Image
      src={SIM_IMAGES[item]}
      alt=""
      boxSize={{ base: '36px', sm: '40px' }}
      borderRadius="md"
      outlineWidth="2px"
      outlineStyle="solid"
      outlineColor={
        state === 'added' ? 'green.300' : state === 'removed' ? 'red.300' : 'transparent'
      }
      opacity={state === 'removed' ? 0.35 : 1}
    />
    {state && (
      <Flex
        position="absolute"
        top="-5px"
        right="-5px"
        boxSize="14px"
        borderRadius="full"
        align="center"
        justify="center"
        bg={state === 'added' ? 'green.300' : 'red.300'}
        color="gray.900"
        fontSize="10px"
      >
        {state === 'added' ? <LuPlus /> : <LuMinus />}
      </Flex>
    )}
  </Box>
);

type SyncSimulationProps = {
  source: CreateDynamicListDialogProps['source'];
  mode: DynamicListTypes;
};

const SyncSimulation = ({ source, mode }: SyncSimulationProps) => {
  const t = useTranslations();

  return (
    <Flex direction="column" gap={3} p={3} borderRadius="md" bg="blackAlpha.300">
      <Box>
        <Text fontSize="xs" color="gray.400" mb={2}>
          {t('DynamicList.sim-source', { source })}
        </Text>
        <Flex gap={2} minH="44px" align="center">
          <SimTile item="a" />
          <SimTile item="b" />
          <SimTile item="c" />
          <SimTile item="d" state="removed" />
          <SimTile item="e" state="added" />
        </Flex>
      </Box>
      <Box>
        <Text fontSize="xs" color="gray.400" mb={2}>
          {t('DynamicList.sim-result')}
        </Text>
        <Flex gap={2} minH="44px" align="center">
          {SIM_RESULT[mode].map((item) => (
            <SimTile key={item} item={item} state={item === 'e' ? 'added' : undefined} />
          ))}
        </Flex>
        <Text fontSize="xs" color={DYNAMIC_LIST_ACCENT_LIGHT} mt={2} fontWeight="medium">
          {t(`DynamicList.sim-outcome-${mode === 'search' ? 'fullSync' : mode}`)}
        </Text>
      </Box>
    </Flex>
  );
};

export default CreateDynamicListDialog;
