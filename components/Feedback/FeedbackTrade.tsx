import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormHelperText,
  HStack,
  Icon,
  IconButton,
  Text,
  useDisclosure,
  Link,
} from '@chakra-ui/react';
import { TradeData } from '../../types';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import CustomNumberInput from '../Input/CustomNumber';
import { useState, useEffect, useMemo, useRef } from 'react';
import { BsArrowLeft, BsArrowLeftRight, BsCheck2 } from 'react-icons/bs';
import { useFormatter, useTranslations } from 'next-intl';
import { FeedbackExperimentsModalProps } from '../Modal/FeedbackExperimentsModal';
import { AiOutlineExperiment } from 'react-icons/ai';
import { useAuth } from '../../utils/auth';
import dynamic from 'next/dynamic';
// import { FaCalculator } from 'react-icons/fa';
// import { TradeCalculatorModalProps } from './TradeCalculatorModal';
//@ts-expect-error missing types
import Sticky from 'react-stickynode';

const FeedbackExperimentsModal = dynamic<FeedbackExperimentsModalProps>(
  () => import('../Modal/FeedbackExperimentsModal')
);

// const TradeCalculatorModal = dynamic<TradeCalculatorModalProps>(
//   () => import('./TradeCalculatorModal')
// );

type Props = {
  trade?: TradeData;
  onChange?: (newValue: TradeData) => void;
  handleSkip?: () => void;
  hasUndo?: boolean;
  handleUndo: () => void;
  handleSubmit?: (trade: TradeData) => void;
};

type TradeItems = TradeData['items'][0];

const FeedbackTrade = (props: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userPref } = useAuth();
  const t = useTranslations();
  const format = useFormatter();
  const { handleSkip, handleSubmit, handleUndo, hasUndo } = props;
  const [forceTrade, setTrade] = useState<TradeData | undefined>(props.trade);
  const [isSticky, setIsSticky] = useState(false);

  const trade = useMemo(() => {
    if (forceTrade && props.trade?.trade_id === forceTrade.trade_id) return forceTrade;
    return props.trade;
  }, [forceTrade, props.trade]);

  const handleChange = (item: TradeItems, index: number) => {
    if (!trade) return;
    const tempTrade = { ...trade };
    tempTrade.items[index] = item;

    if (userPref?.labs_feedbackCopyEquals) {
      tempTrade.items.forEach((originalItem, i) => {
        if (
          originalItem.name === trade.items[index].name &&
          originalItem.image_id === trade.items[index].image_id &&
          i > index
        ) {
          tempTrade.items[i] = { ...originalItem, price: item.price };
        }
      });
    }

    setTrade(tempTrade);
  };

  const doSubmit = () => {
    if (!trade) return;
    handleSubmit?.(trade);
  };

  const isAllPriced = useMemo(() => trade?.items.every((item) => !!item.price), [trade]);

  const isAllEqual = useMemo(
    () =>
      trade?.items.every(
        (item) => item.name === trade.items[0].name && item.image_id === trade.items[0].image_id
      ),
    [trade]
  );

  const isAllEmpty = useMemo(() => trade?.items.every((item) => !item.price), [trade]);

  const itemCount = useMemo(
    () => trade?.items.reduce((sum, item) => sum + (item.amount ?? 1), 0) ?? 0,
    [trade]
  );

  return (
    <>
      <FeedbackExperimentsModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow={{ base: 'column-reverse', md: 'column' }} gap={4}>
        <Flex alignItems="center">
          <HStack gap={4} flex="1" justifyContent="center">
            <Button
              leftIcon={<Icon as={BsArrowLeft} />}
              colorScheme="gray"
              variant="solid"
              isDisabled={!hasUndo}
              onClick={handleUndo}
            >
              {t('General.back')}
            </Button>
            <Button
              leftIcon={<Icon as={BsArrowLeftRight} />}
              colorScheme="gray"
              variant="outline"
              onClick={() => handleSkip?.()}
            >
              {t('General.skip')}
            </Button>
            <Button
              leftIcon={<Icon as={BsCheck2} />}
              colorScheme="green"
              variant="solid"
              mr={2}
              onClick={doSubmit}
            >
              {t('General.submit')}
            </Button>
          </HStack>
          <IconButton
            aria-label="experiments"
            icon={<AiOutlineExperiment />}
            size="sm"
            onClick={onOpen}
          />
        </Flex>
        <CardBase
          chakraWrapper={{ flex: 1, id: 'tradeCard' }}
          title={t('Layout.trade-pricing')}
          chakra={{ bg: 'gray.700' }}
        >
          <Center gap={1}>
            {isAllEqual && trade && itemCount > 1 && (
              <Badge colorScheme="yellow">{t('Feedback.all-equal')}</Badge>
            )}
            <Badge colorScheme="blue">{t('Feedback.x-items', { x: itemCount })}</Badge>
          </Center>
          <Flex flexFlow="column" gap={6}>
            <Sticky
              bottomBoundary="#tradeCard"
              innerZ={1}
              onStateChange={({ status }: { status: number }) => setIsSticky(status !== 0)}
            >
              <Flex
                textAlign="center"
                fontSize="sm"
                wordBreak={'break-word'}
                whiteSpace={'pre-line'}
                flexFlow="column"
                p={2}
                bg={isSticky ? 'gray.800' : undefined}
              >
                <b>{t('ItemPage.wishlist')}</b>
                <Text>{trade?.wishlist}</Text>
                {!!trade?.instantBuy && (
                  <Text mb={2}>
                    <Badge colorScheme="orange">
                      Instant Buy - {format.number(trade.instantBuy)} NP
                    </Badge>
                  </Text>
                )}
              </Flex>
            </Sticky>

            {trade?.items.map((item, i) => (
              <ItemTrade
                trade={trade}
                useShortcuts={userPref?.labs_feedbackShortcuts || false}
                canSubmit={i === trade.items.length - 1 || isAllPriced || (i === 0 && isAllEmpty)}
                doSubmit={doSubmit}
                onChange={(item) => handleChange(item, item.order)}
                item={item}
                key={item.order}
              />
            ))}
          </Flex>
        </CardBase>
      </Flex>
    </>
  );
};

export default FeedbackTrade;

type ItemTradeProps = {
  item: TradeItems;
  trade: TradeData;
  canSubmit?: boolean;
  useShortcuts?: boolean;
  doSubmit?: () => void;
  onChange?: (newValue: TradeItems) => void;
};

const ItemTrade = (props: ItemTradeProps) => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const ref = useRef<HTMLInputElement>(null);
  const setFocus = useRef(false);
  const { item } = props;

  useEffect(() => {
    if (item.order !== 0 || setFocus.current) return;

    if (ref.current) {
      ref.current.focus();
      setFocus.current = true;
    }
  }, [ref.current]);

  const handleChange = (val: string) => {
    const tempItem = { ...item };
    tempItem.price = val ? parseInt(val) : null;

    props.onChange?.(tempItem);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && props.canSubmit) {
      props.doSubmit?.();
    }

    if (e.key.toLowerCase() === 'c') {
      onOpen();
    }

    if (!item.price || !props.useShortcuts) return;

    if (e.key.toLowerCase() === 'k') {
      handleChange(item.price.toString() + '000');
    }

    if (e.key.toLowerCase() === 'm') {
      handleChange(item.price.toString() + '000000');
    }

    if (e.key.toLowerCase() === 'b') {
      handleChange(item.price.toString() + '000000000');
    }
  };

  const closeModal = (val?: string) => {
    if (val) {
      handleChange(val);
    }

    onClose();
  };

  return (
    <>
      {/* {isOpen && (
        <TradeCalculatorModal
          trade={props.trade}
          isOpen={isOpen}
          onClose={closeModal}
          useShortcuts={props.useShortcuts}
          finalRef={ref as any}
        />
      )} */}
      <Flex gap={3}>
        <Box>
          <Image src={item.image} width={80} height={80} alt={item.name} />
        </Box>
        <Flex flex={1} flexFlow="column" justifyContent="center" gap={1}>
          <Link
            href={`/item/${item.item_iid}`}
            wordBreak={'break-word'}
            whiteSpace={'pre-line'}
            fontSize="sm"
            isExternal
            tabIndex={-1}
          >
            {item.amount > 1 && (
              <Badge colorScheme="yellow" mr={1} textTransform={'none'}>
                {item.amount}x
              </Badge>
            )}
            {item.name}
          </Link>
          <FormControl>
            <HStack>
              <CustomNumberInput
                skipDebounce
                wrapperProps={{
                  variant: 'filled',
                  size: 'sm',
                  placeholder: t('Feedback.unit-price-in-neopoints'),
                  flex: 1,
                }}
                inputProps={{
                  ref: ref,
                  placeholder: t('Feedback.unit-price-in-neopoints'),
                  textAlign: 'left',
                  onKeyDown: handleKeyDown,
                  name: item.trade_id + item.name + item.order,
                }}
                value={item.price?.toString()}
                onChange={(val) => handleChange(val)}
              />
              {/* <IconButton
                tabIndex={-1}
                size="sm"
                icon={<FaCalculator />}
                onClick={onOpen}
                aria-label="Calculator"
              /> */}
            </HStack>
            <FormHelperText fontSize="xs">
              {item.amount > 1 && (
                <>
                  {t.rich('Feedback.multiple-amount-msg', {
                    b: (children) => <b>{children}</b>,
                  })}
                  <br />
                </>
              )}
              {t('Feedback.leave-empty-if-price-is-not-specified')}
            </FormHelperText>
          </FormControl>
        </Flex>
      </Flex>
    </>
  );
};
