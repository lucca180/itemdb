'use client';

import {
  Box,
  Center,
  Field,
  Flex,
  Heading,
  NativeSelect,
  Separator,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useFormatter } from 'next-intl';
import { useMemo, useState } from 'react';
import Image from '@components/Utils/Image';
import { MultiplyInput } from '@components/Input/MultiplyInput';
import FeedbackButton from '@components/Feedback/FeedbackButton';
import type {
  PriceCalculatorCalcMode,
  PriceCalculatorPageLabels,
} from './buildPriceCalculatorPageProps';

type PriceCalculatorPageClientProps = {
  labels: PriceCalculatorPageLabels;
};

export function PriceCalculatorPageClient({ labels }: PriceCalculatorPageClientProps) {
  const formatter = useFormatter();
  const [askingPrice, setAskingPrice] = useState<number>();
  const [isPremium, setIsPremium] = useState(false);
  const [calcMode, setCalcMode] = useState<PriceCalculatorCalcMode>('pure');

  const tradingValue = useMemo(() => {
    if (!askingPrice) return { pure: 0, babyPB: 0 };

    const MAX_TP_VALUE = isPremium ? 20000000 : 10000000;
    const MAX_TP_ITEMS = isPremium ? 25 : 15;

    if (calcMode === 'pure') {
      let pureVal = askingPrice > MAX_TP_VALUE ? MAX_TP_VALUE : askingPrice;
      const babyPBVal = Math.ceil((askingPrice - pureVal) / 600000);
      pureVal = askingPrice - babyPBVal * 600000;
      return { pure: pureVal, babyPB: babyPBVal };
    }

    if (calcMode === 'babyPB' || calcMode === 'babyPBNoLimit') {
      if (askingPrice < 600000) return { pure: askingPrice, babyPB: 0 };
      let babyPBVal = Math.floor(askingPrice / 600000);

      if (calcMode === 'babyPB' && askingPrice <= 8000000) {
        babyPBVal = Math.min(babyPBVal, MAX_TP_ITEMS);
      }

      const pureVal = askingPrice - babyPBVal * 600000;
      return { pure: pureVal, babyPB: babyPBVal };
    }

    return { pure: 0, babyPB: 0 };
  }, [askingPrice, calcMode, isPremium]);

  const auctionValue = useMemo(() => {
    if (!askingPrice) return { startPrice: 0, minIncrement: 0 };

    if (calcMode === 'startPrice') {
      let startPrice = Math.min(askingPrice, 50000000);
      let minIncrement = askingPrice - startPrice;

      if (!minIncrement) {
        minIncrement = 1;
        startPrice = askingPrice - minIncrement;
      }

      return { startPrice, minIncrement };
    }

    if (calcMode === 'minIncrement') {
      const minIncrement = Math.min(Math.floor(askingPrice / 2), 50000000);
      const startPrice = askingPrice - minIncrement;
      return { startPrice, minIncrement };
    }

    return { startPrice: 0, minIncrement: 0 };
  }, [askingPrice, calcMode]);

  const handleChange = (val?: string) => {
    if (!val) {
      setAskingPrice(undefined);
      return;
    }

    setAskingPrice(parseInt(val, 10));
  };

  const calcModeOptions = Object.entries(labels.calcModeOptions) as [
    PriceCalculatorCalcMode,
    string,
  ][];

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(66, 202, 255, 0.7) 70%)`}
        zIndex={-1}
      />
      <Center mt={8} flexFlow="column" gap={2} textAlign="center">
        <Image
          src={'https://images.neopets.com/caption/caption_1282.jpg'}
          width={400}
          height={200}
          objectPosition={'top'}
          objectFit={'cover'}
          borderRadius={'md'}
          boxShadow={'md'}
          alt=""
        />
        <Heading as="h1" size="lg">
          {labels.heading}
        </Heading>
        <Text maxW={'700px'} textAlign={'center'} fontSize={'sm'} css={{ textWrap: 'pretty' }}>
          {labels.description}
        </Text>
        <Center mt={8} w="100%">
          <Flex
            bg="blackAlpha.400"
            p={3}
            borderRadius={'md'}
            flexFlow="column"
            gap={4}
            w="100%"
            maxW="500px"
            textAlign={'left'}
          >
            <Field.Root>
              <Field.Label fontSize={'sm'}>{labels.askingPriceLabel}</Field.Label>
              <MultiplyInput
                wrapperProps={{
                  w: '100%',
                  bg: 'initial',
                  size: 'sm',
                }}
                inputProps={{
                  placeholder: labels.askingPricePlaceholder,
                }}
                onChange={handleChange}
              />
              <Field.HelperText fontSize={'xs'}>{labels.priceHelperText}</Field.HelperText>
            </Field.Root>
            <Field.Root>
              <NativeSelect.Root size="sm" variant="subtle">
                <NativeSelect.Field
                  onChange={(e) => setCalcMode(e.target.value as PriceCalculatorCalcMode)}
                  value={calcMode}
                >
                  {calcModeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root>
              <Switch.Root
                display="flex"
                alignItems="center"
                checked={isPremium}
                onCheckedChange={(e) => setIsPremium(e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Label fontSize="sm" mb="0">
                  {labels.premiumMemberLabel}
                </Switch.Label>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </Field.Root>
            {(!!tradingValue.pure || !!tradingValue.babyPB) && (
              <>
                <Separator />
                <Text textAlign={'center'} color={'whiteAlpha.700'}>
                  {labels.youShouldAskFor}
                </Text>
                {tradingValue.babyPB > 10 && (
                  <Text fontSize={'xs'} textAlign={'center'} color={'red.300'}>
                    {labels.tpWarning}
                  </Text>
                )}
                <Text textAlign={'center'}>
                  {!!tradingValue.pure && `${formatter.number(tradingValue.pure)} NP`}{' '}
                  {!!tradingValue.pure && !!tradingValue.babyPB && ' + '}{' '}
                  {!!tradingValue.babyPB && `${tradingValue.babyPB} ${labels.babyPaintBrushLabel}`}
                </Text>
              </>
            )}
            {(!!auctionValue.startPrice || !!auctionValue.minIncrement) && (
              <>
                <Separator />
                <Text textAlign={'center'} color={'whiteAlpha.700'}>
                  {labels.yourAuctionShouldBe}
                </Text>
                {askingPrice! > 100000000 && (
                  <Text fontSize={'xs'} textAlign={'center'} color={'red.300'}>
                    {labels.auctionWarning}
                  </Text>
                )}
                <Text textAlign={'center'}>
                  {!!auctionValue.startPrice &&
                    `${labels.startingPriceLabel} ${formatter.number(auctionValue.startPrice)} NP`}{' '}
                  <br />
                  {!!auctionValue.minIncrement &&
                    `${labels.minIncrementLabel} ${formatter.number(auctionValue.minIncrement)} NP`}
                </Text>
                <Text textAlign={'center'} color={'whiteAlpha.700'} fontSize={'xs'}>
                  {labels.auctionHelperText.replace('__VALUE__', formatter.number(askingPrice!))}
                </Text>
              </>
            )}
          </Flex>
        </Center>
        <FeedbackButton mt={5} />
      </Center>
    </>
  );
}
