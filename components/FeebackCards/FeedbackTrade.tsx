import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  HStack,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { TradeData } from '../../types';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import CustomNumberInput from '../Input/CustomNumber';
import { useState, useEffect, useMemo, useRef } from 'react';
import { BsArrowLeft, BsArrowLeftRight, BsCheck2 } from 'react-icons/bs';
import { useTranslations } from 'next-intl';
import { FeedbackExperimentsModalProps } from '../Modal/FeedbackExperimentsModal';
import { AiOutlineExperiment } from 'react-icons/ai';
import { useAuth } from '../../utils/auth';
import dynamic from 'next/dynamic';

const FeedbackExperimentsModal = dynamic<FeedbackExperimentsModalProps>(
  () => import('../Modal/FeedbackExperimentsModal')
);

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
  const { handleSkip, handleSubmit, handleUndo, hasUndo } = props;
  const [trade, setTrade] = useState<TradeData | undefined>(props.trade);

  useEffect(() => {
    setTrade(props.trade);
  }, [props.trade]);

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

  const isAllPriced = useMemo(() => {
    return trade?.items.every((item) => !!item.price);
  }, [trade]);

  return (
    <>
      <FeedbackExperimentsModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow={{ base: 'column-reverse', md: 'column' }} gap={4}>
        <Flex alignItems="center">
          <IconButton
            // just to keep the layout consistent
            aria-label="experiments"
            icon={<AiOutlineExperiment />}
            size="sm"
            visibility={'hidden'}
            // onClick={onOpen}
          />
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
              onClick={handleSkip}
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
          chakraWrapper={{ flex: 1 }}
          title={t('Layout.trade-pricing')}
          chakra={{ bg: 'gray.700' }}
        >
          <Flex flexFlow="column" gap={6}>
            <Flex
              textAlign="center"
              fontSize="sm"
              wordBreak={'break-word'}
              whiteSpace={'pre-line'}
              flexFlow="column"
              p={2}
            >
              <b>{t('ItemPage.wishlist')}</b>
              <Text>{trade?.wishlist}</Text>
            </Flex>

            {trade?.items.map((item, i) => (
              <ItemTrade
                useShortcuts={userPref?.labs_feedbackShortcuts || false}
                isLast={i === trade.items.length - 1 || isAllPriced}
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
  isLast?: boolean;
  useShortcuts?: boolean;
  doSubmit?: () => void;
  onChange?: (newValue: TradeItems) => void;
};

const ItemTrade = (props: ItemTradeProps) => {
  const t = useTranslations();
  const ref = useRef<HTMLInputElement>(null);
  const { item } = props;

  useEffect(() => {
    if (item.order !== 0) return;

    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const handleChange = (val: string) => {
    const tempItem = { ...item };
    tempItem.price = val ? parseInt(val) : null;

    props.onChange?.(tempItem);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && props.isLast) {
      props.doSubmit?.();
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

  return (
    <Flex gap={3}>
      <Box>
        <Image src={item.image} width={80} height={80} alt={item.name} />
      </Box>
      <Flex flex={1} flexFlow="column" justifyContent="center" gap={1}>
        <Text wordBreak={'break-word'} whiteSpace={'pre-line'} fontSize="sm">
          {item.name}
        </Text>
        <FormControl>
          <CustomNumberInput
            skipDebounce
            wrapperProps={{
              variant: 'filled',
              size: 'sm',
              placeholder: t('General.np-price'),
            }}
            inputProps={{
              ref: ref,
              placeholder: t('General.np-price'),
              textAlign: 'left',
              onKeyDown: handleKeyDown,
              name: item.trade_id + item.name + item.order,
            }}
            value={item.price?.toString()}
            onChange={(val) => handleChange(val)}
          />
          <FormHelperText fontSize="xs">
            {t('Feedback.leave-empty-if-price-is-not-specified')}
          </FormHelperText>
        </FormControl>
      </Flex>
    </Flex>
  );
};
