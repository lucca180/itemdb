import { useMemo, useState } from 'react';
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
  Link,
  Portal,
  SimpleGrid,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useToast } from '@utils/theme/toast';
import {
  GOAL_SITE_URL,
  GOAL_VARIANTS,
  goalListImagePath,
  variantSupportsPaper,
  type GoalBackground,
  type GoalVariant,
} from '@utils/goalCounter/config';
import type { GoalCounterInfo } from '@utils/goalCounter/eligibility';

export type GoalCounterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: number;
  goalCounter: GoalCounterInfo;
};

// preview surfaces only — they don't change the image, they show how it looks where it's pasted
const PREVIEW_BACKGROUNDS = {
  check: {
    backgroundColor: '#f4f2f7',
    backgroundImage: 'repeating-conic-gradient(#d9d6de 0 25%, transparent 0 50%)',
    backgroundSize: '12px 12px',
  },
  light: { backgroundColor: '#ffffff' },
  dark: { backgroundColor: '#1f2129' },
  lookup: {
    backgroundImage: 'linear-gradient(135deg, #ffd8e8 0%, #fff3c4 35%, #c9f0ff 70%, #d9ccff 100%)',
  },
} as const;

type PreviewBackground = keyof typeof PREVIEW_BACKGROUNDS;
const PREVIEW_BACKGROUND_KEYS = Object.keys(PREVIEW_BACKGROUNDS) as PreviewBackground[];

const GoalCounterModal = (props: GoalCounterModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, listId, goalCounter } = props;

  const [variant, setVariant] = useState<GoalVariant>('mosaic');
  const [paper, setPaper] = useState(false);
  const [previewBg, setPreviewBg] = useState<PreviewBackground>('check');
  // random per modal open: previews skip the browser/CDN cache, the embed code doesn't
  const [cacheBuster] = useState(() => Math.random().toString(36).slice(2, 10));
  const previewSrc = (path: string) => `${path}?v=${cacheBuster}`;

  const surface = PREVIEW_BACKGROUNDS[previewBg];

  const bgFor = (v: GoalVariant): GoalBackground =>
    paper && variantSupportsPaper(v) ? 'paper' : 'transparent';

  const imagePath = goalListImagePath(listId, { variant, bg: bgFor(variant) });
  const imageUrl = `${GOAL_SITE_URL}${imagePath}`;
  const embedCode = useMemo(
    () => `<img src="${imageUrl}" alt="${goalCounter.avatarName} - itemdb">`,
    [imageUrl, goalCounter.avatarName]
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
                <Image src={goalCounter.avatarImage} alt="" w="50px" h="50px" />
                <Box>
                  <Dialog.Title fontSize="lg" fontWeight="bold">
                    {t('GoalCounter.title')}
                  </Dialog.Title>
                  <Text fontSize="sm" color="whiteAlpha.700">
                    {goalCounter.avatarName}
                  </Text>
                </Box>
              </HStack>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" mb={5}>
                {t('GoalCounter.description')}
              </Text>

              <Grid
                templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }}
                gap={6}
                alignItems="start"
              >
                {/* --- Left: style picker --- */}
                <Flex flexDirection="column" gap={4} minW={0}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {t('GoalCounter.style')}
                    </Text>
                    <SimpleGrid columns={2} gap={2}>
                      {GOAL_VARIANTS.map((v) => {
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
                                src={previewSrc(
                                  goalListImagePath(listId, { variant: v, bg: bgFor(v) })
                                )}
                                alt=""
                                loading="lazy"
                                maxW="100%"
                              />
                            </Flex>
                            <Text fontSize="xs" whiteSpace="normal">
                              {t(`GoalCounter.variant-${v}`)}
                            </Text>
                          </Button>
                        );
                      })}
                    </SimpleGrid>
                  </Box>

                  <Field.Root>
                    <Switch.Root
                      checked={paper}
                      onCheckedChange={({ checked }) => setPaper(checked)}
                      disabled={!variantSupportsPaper(variant)}
                      display="flex"
                      alignItems="center"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Label mb="0" fontSize="sm">
                        {t('GoalCounter.paper-background')}
                      </Switch.Label>
                    </Switch.Root>
                    {!variantSupportsPaper(variant) && (
                      <Field.HelperText fontSize="xs">
                        {t('GoalCounter.paper-album-only')}
                      </Field.HelperText>
                    )}
                  </Field.Root>
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
                    <Image
                      src={previewSrc(imagePath)}
                      alt={goalCounter.avatarName}
                      css={{ imageRendering: 'pixelated', zoom: 2 }}
                    />
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
                      >
                        {t('GoalCounter.open-image')}
                      </Link>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={copyCode}
                        data-umami-event="goal-counter-copy"
                        data-umami-event-variant={variant}
                      >
                        {t('GoalCounter.copy-code')}
                      </Button>
                    </HStack>
                    <Alert.Root status="info" size="sm" borderRadius="md" mt={3}>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{t('GoalCounter.update-title')}</Alert.Title>
                        <Alert.Description>
                          {t.rich('GoalCounter.update-note', {
                            b: (chunks) => <b>{chunks}</b>,
                          })}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  </Box>
                </Flex>
              </Grid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose}>{t('General.close')}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default GoalCounterModal;
