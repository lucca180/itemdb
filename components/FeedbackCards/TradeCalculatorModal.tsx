import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Text,
  VStack,
  ModalProps,
  Kbd,
  Alert,
  AlertTitle,
  AlertDescription,
  Box,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import CustomNumberInput from '../Input/CustomNumber';
import { useMemo, useRef, useState } from 'react';
import { TradeData } from '../../types';

export type TradeCalculatorModalProps = {
  isOpen: boolean;
  trade: TradeData;
  onClose: (val?: string) => void;
  useShortcuts?: boolean;
  finalRef?: ModalProps['finalFocusRef'];
};

export default function TradeCalculatorModal(props: TradeCalculatorModalProps) {
  const t = useTranslations();
  const format = useFormatter();

  const { isOpen, onClose, trade } = props;
  const [purePrice, setPurePrice] = useState<string>();
  const [babyPB, setBabyPB] = useState<string>();

  const pureRef = useRef<HTMLInputElement>(null);
  const babyPBRef = useRef<HTMLInputElement>(null);

  const finalPrice = useMemo(() => {
    if (!purePrice && !babyPB) return 0;

    const purePriceNum = purePrice ? parseInt(purePrice) : 0;
    const babyPBNum = babyPB ? parseInt(babyPB) * 600000 : 0;

    return purePriceNum + babyPBNum;
  }, [purePrice, babyPB]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onClose(finalPrice ? finalPrice.toString() : undefined);
    }

    if (!purePrice || !props.useShortcuts) return;

    if (e.key.toLowerCase() === 'k') {
      setPurePrice(purePrice.toString() + '000');
    }

    if (e.key.toLowerCase() === 'm') {
      setPurePrice(purePrice.toString() + '000000');
    }

    if (e.key.toLowerCase() === 'b') {
      setPurePrice(purePrice.toString() + '000000000');
    }
  };

  const handleKeyDownBabyPB = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      pureRef.current?.focus();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => onClose()}
        isCentered
        initialFocusRef={babyPBRef as any}
        finalFocusRef={props.finalRef}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Feedback.price-calculator')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'} sx={{ a: { color: 'blue.200' } }}>
            <Alert mb={3} size={'sm'} justifyContent={'center'} borderRadius={'md'} p={1}>
              <Box textAlign={'center'}>
                <AlertTitle>Wishlist</AlertTitle>
                <AlertDescription>{trade.wishlist}</AlertDescription>
              </Box>
            </Alert>
            <Text color="gray.400" textAlign={'center'} fontSize={'xs'}>
              {t.rich('Feedback.calculator-tip', {
                Kbd: (children) => <Kbd>{children}</Kbd>,
              })}
            </Text>
            <VStack mt={6}>
              <FormControl>
                <FormLabel fontSize="sm">
                  {t('Feedback.calculator-baby-paint-brush-amount')}
                </FormLabel>
                <CustomNumberInput
                  skipDebounce
                  wrapperProps={{
                    variant: 'filled',
                    size: 'sm',
                  }}
                  inputProps={{
                    textAlign: 'left',
                    name: 'purePrice',
                    ref: babyPBRef,
                    onKeyDown: handleKeyDownBabyPB,
                  }}
                  value={babyPB}
                  onChange={(val) => setBabyPB(val)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">{t('Feedback.calculator-pure-price')}</FormLabel>
                <CustomNumberInput
                  skipDebounce
                  wrapperProps={{
                    variant: 'filled',
                    size: 'sm',
                  }}
                  inputProps={{
                    ref: pureRef,
                    textAlign: 'left',
                    onKeyDown: handleKeyDown,
                    name: 'purePrice',
                  }}
                  value={purePrice}
                  onChange={(val) => setPurePrice(val)}
                />
              </FormControl>

              <Text>
                {t('Feedback.calculator-final-price')}: {format.number(finalPrice)} NP
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={() => onClose()} size="sm">
              {t('General.close')}
            </Button>

            <Button
              onClick={() => onClose(finalPrice ? finalPrice.toString() : undefined)}
              size="sm"
              ml={3}
            >
              {t('Feedback.calculator-set-price')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
