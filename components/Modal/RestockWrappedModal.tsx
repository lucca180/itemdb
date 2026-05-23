import {
  Accordion,
  Button,
  Box,
  Center,
  CloseButton,
  Dialog,
  Link,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useToast } from '@utils/toast';
import { useTranslations } from 'next-intl';
import { RestockWrappedCard } from '../Hubs/Restock/WrappedCard';
import { RestockStats } from '../../types';
import { useToPng } from '@hugocxl/react-to-image';
import Color from 'color';
import { useState, useEffect, useRef } from 'react';
import { FaCopy, FaDice, FaDownload, FaShareAlt } from 'react-icons/fa';
import axios from 'axios';

const SKIP_WALL = process.env.NEXT_PUBLIC_SKIP_CONTRIBUTE_WALL === 'true';

export type RestockWrappedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stats: RestockStats;
  timePeriod?: number;
};

type CheckWrapped = {
  canWrapped: boolean;
  needTrades: number;
  needVotes: number;
};

const RestockWrappedModal = (props: RestockWrappedModalProps) => {
  const t = useTranslations();
  const toast = useToast();
  const { isOpen, onClose, stats, timePeriod } = props;
  const [bgGradient, setBgGradient] = useState<string>('');
  const [wrappedCheck, setWrappedCheck] = useState<CheckWrapped | undefined>();
  const action = useRef<string>('download');

  const [state, convert, imgRef] = useToPng<HTMLDivElement>({
    onSuccess: (data) => {
      if (action.current === 'share') shareImg(data);
      if (action.current === 'download') downloadImg(data);
      if (action.current === 'copy') copyImg(data);
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: t('General.an-error-occured-please-try-again-later'),
        status: 'error',
        duration: 5000,
      });

      console.error(err);
    },
  });

  useEffect(() => {
    if (isOpen) init();
  }, [isOpen]);

  useEffect(() => {
    getBgColor();
  }, [stats]);

  const doAction = (act: string) => {
    action.current = act;
    convert();
  };

  const init = async () => {
    // wait to show contribute-wall
    if (Date.now() < 1722124799000 || SKIP_WALL) {
      setWrappedCheck({ canWrapped: true, needTrades: 0, needVotes: 0 });
      return;
    }

    const res = await axios.get('/api/v1/restock/wrapped-check');
    setWrappedCheck(res.data);
  };

  const getBgColor = () => {
    if (!stats.hottestBought) return '';
    let gradient = '';

    let i = 0;
    const maxColors = 4;
    const boughtSet = stats.hottestBought.slice(1, maxColors + 1);
    while (boughtSet.length > 0) {
      const bought = pickOne(boughtSet);
      boughtSet.splice(boughtSet.indexOf(bought), 1);

      const color = Color(bought.item.color.hex)
        .lightness(randomInt(60, 95))
        .saturationl(randomInt(60, 95));

      const x = randomInt(0, 100);
      const y = randomInt((i - 0.5) * (100 / maxColors), i * 1.1 * (100 / maxColors));

      gradient += `radial-gradient(at ${x}% ${y}%, ${color
        .hsl()
        .toString()} 0px, transparent 50%),`;
      i++;
    }

    setBgGradient(gradient);
  };

  const shareImg = async (imageDataURL: string) => {
    const imgBlob = await (await fetch(imageDataURL)).blob();

    const data = {
      files: [
        new File([imgBlob], 'itemdb-restock-wrapped.png', {
          type: imgBlob.type,
        }),
      ],
      title: 'itemdb Restock Wrapped',
      text: 'Hey, here is my itemdb Restock Wrapped!',
    };

    try {
      if (!navigator.canShare(data)) {
        throw new Error('Web Share API not supported');
      }
      await navigator.share(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      console.error(err.name, err.message);
    }
  };

  const downloadImg = async (imageDataURL: string) => {
    const link = document.createElement('a');
    link.download = `itemdb-restock-wrapped-${Date.now()}.png`;
    link.href = imageDataURL;
    link.click();
  };

  const copyImg = async (imageDataURL: string) => {
    try {
      const imgBlob = await (await fetch(imageDataURL)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': imgBlob,
        }),
      ]);

      toast({
        title: t('General.success'),
        description: t('Restock.image-copied-to-clipboard'),
        status: 'success',
        duration: 5000,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: t('General.an-error-occured-please-try-again-later'),
        status: 'error',
        duration: 5000,
      });
      console.error(err.name, err.message);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Restock Card</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {wrappedCheck?.canWrapped && (
                <Center flexFlow={'column'}>
                  <RestockWrappedCard
                    stats={stats}
                    timePeriod={timePeriod}
                    bgGradient={bgGradient}
                    innerRef={imgRef}
                  />
                  <Center mt={3} gap={2}>
                    <Button
                      colorPalette="gray"
                      onClick={getBgColor}
                      loading={state.isLoading}
                      size="sm"
                    >
                      <FaDice />
                    </Button>
                    <Button
                      colorPalette="gray"
                      onClick={() => doAction('copy')}
                      loading={state.isLoading}
                      size="sm"
                    >
                      <FaCopy />
                    </Button>
                    {!!navigator.canShare && (
                      <Button
                        colorPalette="gray"
                        onClick={() => doAction('share')}
                        loading={state.isLoading}
                        size="sm"
                      >
                        <FaShareAlt />
                      </Button>
                    )}
                    <Button
                      colorPalette="gray"
                      onClick={() => doAction('download')}
                      loading={state.isLoading}
                      size="sm"
                    >
                      <FaDownload />
                    </Button>
                  </Center>
                </Center>
              )}
              {!wrappedCheck && (
                <Center flexFlow={'column'}>
                  <Spinner />
                  {t('Layout.loading')}
                </Center>
              )}
              {wrappedCheck && !wrappedCheck.canWrapped && (
                <Center
                  flexFlow={'column'}
                  css={{ b: { color: 'green.200' }, a: { color: 'green.300' } }}
                >
                  <Text textAlign={'center'} fontSize={'sm'}>
                    {t.rich('Restock.wrapped-text1', {
                      b: (chunk) => <b>{chunk}</b>,
                    })}
                  </Text>
                  <Text textAlign={'center'} fontSize={'sm'}>
                    <br />
                    {t('Restock.wrapped-text2')}
                    <br />
                    <br />
                  </Text>
                  <Text textAlign={'center'} fontSize={'sm'}>
                    {t.rich('Restock.wrapped-precify-text', {
                      Link: (chunk) => (
                        <Link href="/feedback/trades" target="_blank" rel="noreferrer">
                          {chunk}
                        </Link>
                      ),
                      b: (chunk) => <b>{chunk}</b>,
                      needTrades: wrappedCheck.needTrades,
                    })}
                  </Text>
                  <Text textAlign={'center'} fontSize={'sm'}>
                    {t.rich('Restock.wrapped-vote-text', {
                      Link: (chunk) => (
                        <Link href="/feedback/vote" target="_blank" rel="noreferrer">
                          {chunk}
                        </Link>
                      ),
                      b: (chunk) => <b>{chunk}</b>,
                      needVotes: wrappedCheck.needVotes,
                    })}
                    <br />
                    <br />
                  </Text>
                  <Text textAlign={'center'} fontSize={'sm'}>
                    {t('Restock.wrapped-text3')}
                  </Text>
                  <Accordion.Root collapsible w="100%" mt={5}>
                    <Accordion.Item value="wrapped-info">
                      <Accordion.ItemTrigger>
                        <Box as="span" flex="1" textAlign="left">
                          {t('Restock.wrapped-text4')}
                        </Box>
                        <Accordion.ItemIndicator />
                      </Accordion.ItemTrigger>
                      <Accordion.ItemContent>
                        <Accordion.ItemBody pb={4} fontSize={'sm'}>
                          {t.rich('Restock.wrapped-text5', {
                            br: () => <br />,
                          })}
                        </Accordion.ItemBody>
                      </Accordion.ItemContent>
                    </Accordion.Item>
                  </Accordion.Root>
                </Center>
              )}
            </Dialog.Body>
            <Dialog.Footer justifyContent={'center'}>
              {wrappedCheck && wrappedCheck.canWrapped && (
                <Text fontSize={'xs'} textAlign={'center'} color="gray.400">
                  Leave your feedback and ideas using the Feedback button!
                </Text>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default RestockWrappedModal;

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const pickOne = (arr: any[]) => {
  return arr[Math.floor(Math.random() * arr.length)];
};
