import {
  Alert,
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Text,
  VStack,
  Kbd,
  Portal,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import CustomNumberInput from '@components/Input/CustomNumber';
import { TradeData } from '../../types';

export type TradeCalculatorModalProps = {
  isOpen: boolean;
  trade: TradeData;
  onClose: (val?: string) => void;
  useShortcuts?: boolean;
  finalRef?: React.RefObject<HTMLElement | null>;
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
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      initialFocusEl={() => babyPBRef.current}
      finalFocusEl={() => props.finalRef?.current ?? null}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Feedback.price-calculator')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body fontSize="sm" css={{ '& a': { color: 'blue.200' } }}>
              <Alert.Root
                mb={3}
                size="sm"
                justifyContent="center"
                borderRadius="md"
                p={1}
                status="info"
              >
                <Alert.Content>
                  <Box textAlign="center">
                    <Alert.Title>Wishlist</Alert.Title>
                    <Alert.Description>{trade.wishlist}</Alert.Description>
                  </Box>
                </Alert.Content>
              </Alert.Root>
              <Text color="gray.400" textAlign="center" fontSize="xs">
                {t.rich('Feedback.calculator-tip', {
                  Kbd: (children) => <Kbd>{children}</Kbd>,
                })}
              </Text>
              <VStack mt={6}>
                <Field.Root>
                  <Field.Label fontSize="sm">
                    {t('Feedback.calculator-baby-paint-brush-amount')}
                  </Field.Label>
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
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t('Feedback.calculator-pure-price')}</Field.Label>
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
                </Field.Root>

                <Text>
                  {t('Feedback.calculator-final-price')}: {format.number(finalPrice)} NP
                </Text>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
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
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
