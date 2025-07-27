import {
  Heading,
  Text,
  Center,
  Box,
  Flex,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
} from '@chakra-ui/react';
import Layout from '../../components/Layout';
import { createTranslator, useFormatter, useTranslations } from 'next-intl';
import { ReactElement, useMemo, useState } from 'react';
import Image from '../../components/Utils/Image';
import { MultiplyInput } from '../../components/Input/MultiplyInput';
import { loadTranslation } from '@utils/load-translation';
import FeedbackButton from '@components/Feedback/FeedbackButton';

const PriceCalculator = () => {
  const t = useTranslations();
  const formatter = useFormatter();
  const [askingPrice, setAskingPrice] = useState<number>();
  const [calcMode, setCalcMode] = useState<
    'pure' | 'babyPB' | 'startPrice' | 'minIncrement' | 'babyPBNoLimit'
  >('pure');

  const tradingValue = useMemo(() => {
    if (!askingPrice) return { pure: 0, babyPB: 0 };

    const MAX_TP_VALUE = 2000000;

    if (calcMode === 'pure') {
      let pureVal = askingPrice > MAX_TP_VALUE ? MAX_TP_VALUE : askingPrice;

      const babyPBVal = Math.ceil((askingPrice - pureVal) / 600000);

      pureVal = askingPrice - babyPBVal * 600000;

      return { pure: pureVal, babyPB: babyPBVal };
    }

    if (calcMode === 'babyPB' || calcMode === 'babyPBNoLimit') {
      if (askingPrice < 600000) return { pure: askingPrice, babyPB: 0 };
      let babyPBVal = Math.floor(askingPrice / 600000);

      if (calcMode === 'babyPB' && askingPrice <= 8000000) babyPBVal = Math.min(babyPBVal, 10);

      const pureVal = askingPrice - babyPBVal * 600000;

      return { pure: pureVal, babyPB: babyPBVal };
    }

    return { pure: 0, babyPB: 0 };
  }, [askingPrice, calcMode]);

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

      return { startPrice: startPrice, minIncrement };
    }

    return { startPrice: 0, minIncrement: 0 };
  }, [askingPrice, calcMode]);

  const handleChange = (val?: string) => {
    if (!val) {
      setAskingPrice(undefined);
      return;
    }

    setAskingPrice(parseInt(val));
  };

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
          alt="happy zafara painting a picture"
        />
        <Heading as="h1" size="lg">
          {t('Calculator.pricing-calculator')}
        </Heading>
        <Text maxW={'700px'} textAlign={'center'} fontSize={'sm'} sx={{ textWrap: 'pretty' }}>
          {t('Calculator.description')}
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
            <FormControl>
              <FormLabel fontSize={'sm'}>{t('Calculator.your-asking-price-in-nps')}</FormLabel>
              <MultiplyInput
                wrapperProps={{
                  bg: 'initial',
                  size: 'sm',
                }}
                inputProps={{
                  placeholder: t('Calculator.enter-the-price-in-neopoints'),
                }}
                onChange={handleChange}
              />
              <FormHelperText fontSize={'xs'}>{t('Calculator.price-helper-text')}</FormHelperText>
            </FormControl>
            <FormControl>
              <Select
                size={'sm'}
                variant={'filled'}
                onChange={(e) => setCalcMode(e.target.value as any)}
                value={calcMode}
              >
                <option value="pure">{t('Calculator.tp-max-pure-value')}</option>
                <option value="babyPB">{t('Calculator.tp-max-baby-paint-brush-amount')}</option>
                <option value="babyPBNoLimit">
                  {t('Calculator.tp-max-baby-paint-brush-amount-no-10-item-limit')}
                </option>
                <option value="startPrice">{t('Calculator.auction-max-start-price')}</option>
                <option value="minIncrement">
                  {t('Calculator.auction-max-minimum-increment')}
                </option>
              </Select>
            </FormControl>
            {(!!tradingValue.pure || !!tradingValue.babyPB) && (
              <>
                <Divider />
                <Text textAlign={'center'} color={'whiteAlpha.700'}>
                  {t('Calculator.you-should-ask-for')}
                </Text>
                {tradingValue.babyPB > 10 && (
                  <Text fontSize={'xs'} textAlign={'center'} color={'red.300'}>
                    {t('Calculator.tp-warning')}
                  </Text>
                )}
                <Text textAlign={'center'}>
                  {!!tradingValue.pure && `${formatter.number(tradingValue.pure)} NP`}{' '}
                  {!!tradingValue.pure && !!tradingValue.babyPB && ' + '}{' '}
                  {!!tradingValue.babyPB &&
                    `${tradingValue.babyPB} Baby
              Paint Brush`}
                </Text>
              </>
            )}
            {(!!auctionValue.startPrice || !!auctionValue.minIncrement) && (
              <>
                <Divider />
                <Text textAlign={'center'} color={'whiteAlpha.700'}>
                  {t('Calculator.your-auction-should-be')}
                </Text>
                {askingPrice! > 100000000 && (
                  <Text fontSize={'xs'} textAlign={'center'} color={'red.300'}>
                    {t('Calculator.auction-warning')}
                  </Text>
                )}
                <Text textAlign={'center'}>
                  {!!auctionValue.startPrice &&
                    `Starting Price: ${formatter.number(auctionValue.startPrice)} NP`}{' '}
                  <br />
                  {!!auctionValue.minIncrement &&
                    `Min Increment: ${formatter.number(auctionValue.minIncrement)} NP`}
                </Text>
                <Text textAlign={'center'} color={'whiteAlpha.700'} fontSize={'xs'}>
                  {t('Calculator.auction-helper-text', {
                    x: formatter.number(askingPrice!),
                  })}
                </Text>
              </>
            )}
          </Flex>
        </Center>
        <FeedbackButton mt={5} />
      </Center>
    </>
  );
};

export default PriceCalculator;

export async function getStaticProps(context: any) {
  return {
    props: {
      messages: await loadTranslation(context.locale, 'tools/price-calculator'),
      locale: context.locale,
    },
  };
}

PriceCalculator.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  return (
    <Layout
      SEO={{
        title: t('Calculator.pricing-calculator'),
        description: t('Calculator.description'),
        themeColor: '#3697bf',
      }}
      mainColor="#3697bfc7"
    >
      {page}
    </Layout>
  );
};
