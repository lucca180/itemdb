import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Link,
  OrderedList,
  ListItem,
  Text,
  Box,
  UnorderedList,
  Spinner,
  Center,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { ItemData, PricingInfo } from '../../types';
import useSWRImmutable from 'swr';
import axios from 'axios';
import router from 'next/router';
import { useState } from 'react';

export type WrongPriceModalProps = {
  isOpen: boolean;
  item: ItemData;
  onClose: () => void;
};
const fetcher = (url: string) => axios.get(url).then((res) => res.data as PricingInfo);

export default function WrongPriceModal(props: WrongPriceModalProps) {
  const t = useTranslations();
  const { isOpen, onClose, item } = props;
  const { data, isLoading } = useSWRImmutable(`/api/v1/prices/${item.internal_id}/status`, fetcher);

  const [isButtonLoading, setButtonLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const sendReport = async () => {
    setButtonLoading(true);
    try {
      const res = await axios.post('/api/feedback/send', {
        subject_id: item.internal_id,
        json: JSON.stringify({
          message: 'User cried for help',
        }),
        type: 'priceReport',
        pageInfo: router.asPath,
      });

      setButtonLoading(false);

      if (res.data.success) setIsSuccess(true);
      else throw res.data;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('ItemPage.wrongPriceHeader')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody fontSize={'sm'} sx={{ a: { color: 'blue.200' }, b: { color: 'blue.300' } }}>
            {t('ItemPage.wrongPrice-0')}
            <Accordion bg="gray.800" size="sm" p={2} my={3} borderRadius={'md'} allowToggle>
              <AccordionItem border={0}>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    <Text fontSize={'sm'} color="gray.400">
                      {t('ItemPage.current-data-status')}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  {!isLoading && (
                    <>
                      <UnorderedList ml={6} spacing={2}>
                        <ListItem>
                          <Link
                            as={NextLink}
                            href={`/feedback/trades?target=${item.name}`}
                            isExternal
                          >
                            {t('ItemPage.waiting-trades')}
                          </Link>{' '}
                          - {t('ItemPage.x-entries', { x: data?.waitingTrades ?? 0 })}
                          <Text fontSize={'xs'} mb={1} color="gray.400">
                            {t('ItemPage.waiting-trades-txt')}
                          </Text>
                        </ListItem>
                        <ListItem>
                          {t('ItemPage.fresh-data')} -{' '}
                          {t('ItemPage.x-entries', { x: data?.dataStatus.fresh ?? 0 })}
                          <Text fontSize={'xs'} mb={1} color="gray.400">
                            {t('ItemPage.fresh-data-txt')}
                          </Text>
                        </ListItem>
                        <ListItem>
                          {t('ItemPage.old-data')} -{' '}
                          {t('ItemPage.x-entries', { x: data?.dataStatus.old ?? 0 })}
                          <Text fontSize={'xs'} mb={1} color="gray.400">
                            {t('ItemPage.old-data-txt')}
                          </Text>
                        </ListItem>
                      </UnorderedList>
                      <Text fontSize={'xs'} textAlign={'justify'} color="gray.300" my={4}>
                        {t.rich('ItemPage.algorithm-txt', {
                          b: (chunk) => <b>{chunk}</b>,
                        })}
                      </Text>
                      <Text fontSize={'xs'} textAlign={'justify'} color="gray.300">
                        {t('ItemPage.algorithm-txt2')}
                      </Text>
                    </>
                  )}
                  {isLoading && (
                    <Center>
                      <Spinner />
                    </Center>
                  )}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            {t('ItemPage.wrongPrice-1')}{' '}
            <Box bg="gray.800" px={2} py={3} my={3} borderRadius={'md'}>
              <OrderedList ml={6} spacing={2}>
                <ListItem>
                  {t.rich('ItemPage.wrongPrice-2', {
                    Link: (chunk) => (
                      <Link as={NextLink} href="/contribute" isExternal>
                        {chunk}
                      </Link>
                    ),
                  })}
                </ListItem>
                <ListItem>
                  {t('ItemPage.wrongPrice-3')} <br />
                  <Text fontSize="xs" color="gray.400">
                    {t('ItemPage.wrongPrice-4')}
                  </Text>
                </ListItem>
                <ListItem>
                  {t.rich('ItemPage.wrongPrice-5', {
                    Link1: (chunk) => (
                      <Link as={NextLink} href={`/feedback/trades?target=${item.name}`} isExternal>
                        {chunk}
                      </Link>
                    ),
                    Link2: (chunk) => (
                      <Link as={NextLink} href="/feedback/vote" isExternal>
                        {chunk}
                      </Link>
                    ),
                  })}
                </ListItem>
                <ListItem>{t('ItemPage.wrongPrice-6')}</ListItem>
              </OrderedList>
            </Box>
            {t('ItemPage.wrongPrice-7')}
            <Accordion bg="gray.800" size="sm" p={2} my={3} borderRadius={'md'} allowToggle>
              <AccordionItem border={0}>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    <Text fontSize={'sm'} color="gray.400">
                      {t('ItemPage.but-something-is-reaally-wrong')}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} display="flex" flexFlow="column" gap={3}>
                  {t('ItemPage.wrong-price-report')}
                  <Button
                    onClick={sendReport}
                    size="sm"
                    colorScheme={'red'}
                    isLoading={isButtonLoading}
                    isDisabled={isSuccess}
                  >
                    {!isSuccess && t('ItemPage.itemdb-admins-please-help')}
                    {isSuccess && t('ItemPage.thank-you-for-your-report')}
                  </Button>
                  {t('ItemPage.wrong-price-report-2')}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose} size="sm">
              {t('General.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
