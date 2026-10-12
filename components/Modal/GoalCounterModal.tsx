import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Code,
  Dialog,
  Field,
  Flex,
  Grid,
  Group,
  HStack,
  Image,
  Input,
  Link,
  Portal,
  SimpleGrid,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useToast } from '@utils/theme/toast';
import {
  COLLECTION_VARIANTS,
  GOAL_SITE_URL,
  GOAL_SIZES,
  GOAL_TARGET_MAX,
  STAMP_VARIANTS,
  VARIANT_BACKGROUNDS,
  goalListImagePath,
  goalSampleImagePath,
  type GoalBackground,
  type GoalConfig,
  type GoalVariant,
} from '@utils/goalCounter/config';
import type { GoalCounterInfo } from '@utils/goalCounter/eligibility';
import {
  PREVIEW_BACKGROUNDS,
  PREVIEW_BACKGROUND_KEYS,
  type PreviewBackground,
} from '@utils/goalCounter/previewSurfaces';

export type GoalCounterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: number;
  goalCounter: GoalCounterInfo;
};

const parseTarget = (value: string): number | null | 'invalid' => {
  if (!value.trim()) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > GOAL_TARGET_MAX) return 'invalid';
  return n;
};

const GoalCounterModal = (props: GoalCounterModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, listId, goalCounter } = props;
  const isCollection = goalCounter.kind === 'collection';
  // style thumbnails use fixed sample data (same for everyone, cached); only the large preview is live
  const sample =
    goalCounter.kind === 'collection'
      ? goalCounter.collection
      : `stamps-${goalCounter.albumListId}`;
  const variants: readonly GoalVariant[] = isCollection ? COLLECTION_VARIANTS : STAMP_VARIANTS;

  const [variant, setVariant] = useState<GoalVariant>(variants[0]);
  const [bg, setBg] = useState<GoalBackground>('transparent');
  const [showNumber, setShowNumber] = useState(true);
  const [targetInput, setTargetInput] = useState('');
  const [target, setTarget] = useState<number | null>(null);
  const [previewBg, setPreviewBg] = useState<PreviewBackground>('lookup');
  // random per modal open: the live preview skips the browser/CDN cache, the embed code doesn't
  const [cacheBuster] = useState(() => Math.random().toString(36).slice(2, 10));
  const previewSrc = (path: string) => `${path}?v=${cacheBuster}`;

  const parsedTarget = parseTarget(targetInput);
  const targetInvalid = parsedTarget === 'invalid';

  // only reload the previews once the user stops typing
  useEffect(() => {
    if (parsedTarget === 'invalid') return;
    const handle = window.setTimeout(() => setTarget(parsedTarget), 400);
    return () => window.clearTimeout(handle);
  }, [parsedTarget]);

  // tracked once the debounced value settles, not on every keystroke (nor on open)
  const trackedTarget = useRef<number | null>(null);
  useEffect(() => {
    if (!isCollection || target === trackedTarget.current) return;
    trackedTarget.current = target;
    window.umami?.track('goal-counter-target', {
      label: sample,
      target: target === null ? 'default' : 'custom',
    });
  }, [target, isCollection, sample]);

  const surface = PREVIEW_BACKGROUNDS[previewBg];

  const configFor = (v: GoalVariant): GoalConfig => {
    const allowed = VARIANT_BACKGROUNDS[v];
    return {
      variant: v,
      bg: allowed.includes(bg) ? bg : allowed[0],
      showNumber,
      target: isCollection ? target : null,
    };
  };

  const backgrounds = VARIANT_BACKGROUNDS[variant];
  const currentBg = configFor(variant).bg;
  const imagePath = goalListImagePath(listId, configFor(variant));
  const imageUrl = `${GOAL_SITE_URL}${imagePath}`;
  const embedCode = useMemo(
    () => `<img src="${imageUrl}" alt="${goalCounter.name} - itemdb">`,
    [imageUrl, goalCounter.name]
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast({
        id: 'goal-counter-copy',
        title: t('GoalCounter.code-copied'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        id: 'goal-counter-copy',
        title: t('GoalCounter.copy-failed'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <HStack gap={3}>
                <Image src={goalCounter.image} alt="" w="50px" h="50px" borderRadius="md" />
                <Box>
                  <Dialog.Title fontSize="lg" fontWeight="bold">
                    {t('GoalCounter.title')}
                  </Dialog.Title>
                  <Text fontSize="sm" color="whiteAlpha.700">
                    {goalCounter.name}
                  </Text>
                </Box>
              </HStack>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" mb={5}>
                {t(isCollection ? 'GoalCounter.description-collection' : 'GoalCounter.description')}
              </Text>

              <Grid
                templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }}
                gap={6}
                alignItems="start"
              >
                {/* --- Left: style picker + options --- */}
                <Flex flexDirection="column" gap={4} minW={0}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('GoalCounter.style')}
                    </Text>
                    <SimpleGrid columns={2} gap={2}>
                      {variants.map((v) => {
                        const selected = v === variant;
                        return (
                          <Button
                            key={v}
                            onClick={() => setVariant(v)}
                            variant="outline"
                            h="auto"
                            p={2}
                            flexDirection="column"
                            gap={2}
                            borderColor={selected ? 'green.300' : 'whiteAlpha.300'}
                            borderWidth={selected ? '2px' : '1px'}
                            aria-pressed={selected}
                            data-umami-event="goal-counter-variant"
                            data-umami-event-label={sample}
                            data-umami-event-variant={v}
                          >
                            <Flex
                              w="100%"
                              h="96px"
                              alignItems="center"
                              justifyContent="center"
                              borderRadius="sm"
                              css={surface}
                            >
                              <Image
                                src={goalSampleImagePath(sample, configFor(v))}
                                alt=""
                                loading="lazy"
                                maxW="100%"
                              />
                            </Flex>
                            <Text fontSize="xs" whiteSpace="normal">
                              {t(`GoalCounter.variant-${v}`)}{' '}
                              <Text as="span" color="whiteAlpha.600">
                                · {GOAL_SIZES[v][0]}×{GOAL_SIZES[v][1]} px
                              </Text>
                            </Text>
                          </Button>
                        );
                      })}
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('GoalCounter.background')}
                    </Text>
                    {backgrounds.length > 1 ? (
                      <Group attached flexWrap="wrap">
                        {backgrounds.map((key) => (
                          <Button
                            key={key}
                            size="xs"
                            variant={currentBg === key ? 'solid' : 'outline'}
                            aria-pressed={currentBg === key}
                            onClick={() => setBg(key)}
                            data-umami-event="goal-counter-bg"
                            data-umami-event-label={sample}
                            data-umami-event-variant={variant}
                            data-umami-event-bg={key}
                          >
                            {t(`GoalCounter.bg-option-${key}`)}
                          </Button>
                        ))}
                      </Group>
                    ) : (
                      <Text fontSize="xs" color="whiteAlpha.600">
                        {t('GoalCounter.bg-single')}
                      </Text>
                    )}
                  </Box>

                  {(variant === 'classic' || variant === 'stamp-classic') && (
                    <Field.Root>
                      <Switch.Root
                        checked={showNumber}
                        onCheckedChange={({ checked }) => {
                          setShowNumber(checked);
                          window.umami?.track('goal-counter-show-number', {
                            label: sample,
                            variant,
                            showNumber: checked,
                          });
                        }}
                        display="flex"
                        alignItems="center"
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Label mb="0" fontSize="sm">
                          {t('GoalCounter.show-number')}
                        </Switch.Label>
                      </Switch.Root>
                    </Field.Root>
                  )}

                  {isCollection && (
                    <Field.Root invalid={targetInvalid}>
                      <Field.Label fontSize="sm" fontWeight="bold">
                        {t('GoalCounter.goal-target')}
                      </Field.Label>
                      <Input
                        id="goal-counter-target"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={GOAL_TARGET_MAX}
                        size="sm"
                        maxW="160px"
                        value={targetInput}
                        placeholder={t('GoalCounter.goal-target-placeholder')}
                        onChange={(e) => setTargetInput(e.target.value)}
                      />
                      {targetInvalid ? (
                        <Field.ErrorText fontSize="xs">
                          {t('GoalCounter.goal-target-invalid', { max: GOAL_TARGET_MAX })}
                        </Field.ErrorText>
                      ) : (
                        <Field.HelperText fontSize="xs">
                          {t('GoalCounter.goal-target-help', { max: GOAL_TARGET_MAX })}
                        </Field.HelperText>
                      )}
                    </Field.Root>
                  )}
                </Flex>

                {/* --- Right: preview + embed code --- */}
                <Flex flexDirection="column" gap={4} minW={0}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('GoalCounter.preview-background')}
                    </Text>
                    <Group attached flexWrap="wrap">
                      {PREVIEW_BACKGROUND_KEYS.map((key) => (
                        <Button
                          key={key}
                          size="xs"
                          variant={previewBg === key ? 'solid' : 'outline'}
                          aria-pressed={previewBg === key}
                          onClick={() => setPreviewBg(key)}
                          data-umami-event="goal-counter-preview-bg"
                          data-umami-event-label={sample}
                          data-umami-event-preview-bg={key}
                        >
                          {t(`GoalCounter.bg-${key}`)}
                        </Button>
                      ))}
                    </Group>
                  </Box>

                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    minH="200px"
                    p={4}
                    borderRadius="md"
                    css={surface}
                  >
                    <Image src={previewSrc(imagePath)} alt={goalCounter.name} maxW="100%" />
                  </Flex>

                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('GoalCounter.embed-code')}
                    </Text>
                    <Code
                      display="block"
                      p={3}
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      wordBreak="break-all"
                      userSelect="all"
                    >
                      {embedCode}
                    </Code>
                    <HStack mt={2} justifyContent="space-between" flexWrap="wrap">
                      <Link
                        href={previewSrc(imagePath)}
                        target="_blank"
                        rel="noopener"
                        fontSize="xs"
                        color="blue.200"
                        data-umami-event="goal-counter-open-image"
                        data-umami-event-label={sample}
                        data-umami-event-variant={variant}
                      >
                        {t('GoalCounter.open-image')}
                      </Link>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={copyCode}
                        disabled={targetInvalid}
                        data-umami-event="goal-counter-copy"
                        data-umami-event-label={sample}
                        data-umami-event-variant={variant}
                        data-umami-event-bg={currentBg}
                        data-umami-event-show-number={String(showNumber)}
                      >
                        {t('GoalCounter.copy-code')}
                      </Button>
                    </HStack>
                    <Alert.Root status="info" size="sm" borderRadius="md" mt={3}>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{t('GoalCounter.update-title')}</Alert.Title>
                        <Alert.Description>
                          {t.rich(
                            isCollection
                              ? 'GoalCounter.update-note-collection'
                              : 'GoalCounter.update-note',
                            { b: (chunks) => <b>{chunks}</b> }
                          )}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  </Box>
                </Flex>
              </Grid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                onClick={onClose}
                data-umami-event="goal-counter-close"
                data-umami-event-label={sample}
              >
                {t('General.close')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default GoalCounterModal;
