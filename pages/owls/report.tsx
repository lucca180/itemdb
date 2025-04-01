import { ReactElement, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Text,
  Textarea,
  useSteps,
  Link,
} from '@chakra-ui/react';
import Layout from '../../components/Layout';
import HeaderCard from '../../components/Card/HeaderCard';
import { createTranslator, useTranslations } from 'next-intl';
import { ItemData, OwlsTrade, User } from '../../types';
import Image from '../../components/Utils/Image';
import icon from '../../public/logo_icon.svg';
import { format } from 'date-fns';
import { OwlsTradeCard } from '../../components/NCTrades/OwlsTradeHistory';
import { UTCDate } from '@date-fns/utc';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { CheckAuth } from '../../utils/googleCloud';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';

const ItemSelect = dynamic(() => import('../../components/Input/ItemSelect'), {
  ssr: false,
  loading: () => <Input variant={'filled'} placeholder="Add Item" />,
});

const steps = [
  { title: 'Owls.you-offered' },
  { title: 'Owls.you-received' },
  { title: 'Owls.notes-and-comments' },
  { title: 'General.confirm' },
  { title: 'General.success' },
];

type OwlsReport = {
  offered: OwlsTradeItem[];
  received: OwlsTradeItem[];
  notes: string;
  date: string;
};

type OwlsTradeItem = {
  item?: ItemData;
  itemName: string;
  personalValue: string;
  quantity: number;
};

type OwlsReportPageProps = {
  user: User | null;
};

const OwlsReportPage = (props: OwlsReportPageProps) => {
  const { user } = props;
  const { activeStep, goToNext, goToPrevious, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const t = useTranslations();
  const [offered, setOffered] = useState<OwlsTradeItem[]>([]);
  const [received, setReceived] = useState<OwlsTradeItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAddItem = (result: ItemData | string) => {
    const item = typeof result === 'string' ? undefined : result;
    const itemData = typeof result === 'string' ? result.trim() : result?.name;
    setHasError(false);
    let type = 'offered';
    if (activeStep === 1) type = 'received';

    if (type === 'offered') {
      const hasItem = offered.find((i) => i.itemName === itemData);
      if (hasItem) return;

      setOffered([...offered, { item, itemName: itemData, personalValue: '', quantity: 1 }]);
    } else {
      const hasItem = received.find((i) => i.itemName === itemData);
      if (hasItem) return;
      setReceived([...received, { item, itemName: itemData, personalValue: '', quantity: 1 }]);
    }
  };

  const validateContinue = () => {
    let hasFormError = false;

    if (activeStep === 0) {
      hasFormError =
        offered.some(
          (item) =>
            !item.personalValue || !item.quantity || !/^\d+(-\d+)?$/g.test(item.personalValue)
        ) || offered.length === 0;
    }

    if (activeStep === 1) {
      hasFormError =
        received.some(
          (item) =>
            !item.personalValue || !item.quantity || !/^\d+(-\d+)?$/g.test(item.personalValue)
        ) || received.length === 0;
    }

    hasFormError = hasFormError || offered.length === 0;

    setHasError(hasFormError);
    if (!hasFormError) {
      goToNext();
    }
  };

  const removeItem = (index: number) => {
    const type = activeStep === 0 ? 'offered' : 'received';
    setHasError(false);
    if (type === 'offered') {
      const newItems = offered.filter((_, i) => i !== index);
      setOffered(newItems);
    } else {
      const newItems = received.filter((_, i) => i !== index);
      setReceived(newItems);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    const type = activeStep === 0 ? 'offered' : 'received';
    setHasError(false);
    if (type === 'offered') {
      const newItem = { ...offered[index], [name]: value };
      const newItems = [...offered];
      newItems[index] = newItem;
      setOffered(newItems);
    } else {
      const newItem = { ...received[index], [name]: value };
      const newItems = [...received];
      newItems[index] = newItem;
      setReceived(newItems);
    }
  };

  const submitTrade = async () => {
    setIsLoading(true);
    try {
      const owlsTrade = tradeReportToOwlsTrade({ offered, received, notes, date });
      const res = await axios.post('/api/v1/items/owls', owlsTrade);

      if (res.status === 200) {
        goToNext();
      } else throw new Error('Error submitting trade');
    } catch (e) {
      setHasError(true);
    }
  };

  const reset = () => {
    setOffered([]);
    setReceived([]);
    setNotes('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setHasError(false);
    setIsLoading(false);
    setActiveStep(0);
  };

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/309_white_weewoo.gif',
          alt: 'owls thumbnail',
        }}
        color="#47b2f8"
        breadcrumb={
          <Breadcrumbs
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: 'Owls',
                item: '/owls',
              },
              {
                position: 3,
                name: 'Report Trade',
                item: '/owls/report',
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('Owls.report-owls-trade')}
        </Heading>
        <Text as="h2">{t('Owls.description')}</Text>
      </HeaderCard>
      {!user && (
        <Center>
          <Flex
            bg="blackAlpha.400"
            p={4}
            borderRadius="md"
            flexFlow="column"
            gap={4}
            textAlign={'center'}
          >
            <Text fontSize={'sm'}>{t('Owls.login-required')}</Text>
            <Text fontSize={'sm'} color={'gray.400'}>
              {t('Owls.create-account-cta')}
            </Text>
          </Flex>
        </Center>
      )}
      {user && (
        <>
          <Flex w="100%" overflow={'auto'} pb={2}>
            <Stepper w="100%" minW="900px" size="sm" index={activeStep}>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box flexShrink="0">
                    <StepTitle>{t(step.title)}</StepTitle>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          </Flex>
          <Center mt={8} flexFlow={'column'} gap={4}>
            <Flex
              flexFlow="column"
              gap={2}
              p={3}
              bg="blackAlpha.400"
              justifyContent={'center'}
              alignItems={'center'}
              borderRadius={'md'}
              textAlign={'center'}
              w="100%"
              maxW={'900px'}
            >
              {activeStep === 0 && (
                <>
                  <Heading size="md">{t('Owls.items-you-offered')}</Heading>
                  <Text fontSize="sm">{t('Owls.items-you-offered-text')}</Text>
                </>
              )}
              {activeStep === 1 && (
                <>
                  <Heading size="md">{t('Owls.items-you-received')}</Heading>
                  <Text fontSize="sm">{t('Owls.items-you-received-text')}</Text>
                </>
              )}
              {activeStep === 2 && (
                <>
                  <Heading size="md">{t('Owls.notes-and-comments')}</Heading>
                  <Text fontSize="sm">{t('Owls.notes-and-comments-text')}</Text>
                </>
              )}
              {activeStep === 3 && (
                <>
                  <Heading size="md">{t('Owls.confirm-and-submit')}</Heading>
                  <Text fontSize="sm">{t('Owls.confirm-and-submit-text')}</Text>
                </>
              )}
              {activeStep === 4 && (
                <>
                  <Heading size="md">{t('General.success')}!</Heading>
                  <Text fontSize="sm">{t('Owls.success-text')}</Text>
                </>
              )}
              {hasError && (
                <Text color="red.400" fontSize="sm">
                  {activeStep < 3 && t('Owls.form-error')}
                  {activeStep === 3 && t('Owls.send-error')}
                </Text>
              )}
              {activeStep < 2 && (
                <>
                  <Flex my={3} gap={3} flexWrap={'wrap'} justifyContent={'center'}>
                    {(activeStep === 0 ? offered : received).map((item, index) => (
                      <Flex
                        w={{ base: 'auto', md: '370px' }}
                        key={item.itemName + '_offered'}
                        alignItems={'center'}
                        bg="whiteAlpha.200"
                        borderRadius={'md'}
                        p={3}
                        gap={3}
                        textAlign={'left'}
                      >
                        <Flex
                          flexFlow={'column'}
                          alignItems={'center'}
                          justifyContent={'center'}
                          gap={2}
                          minW="80px"
                        >
                          <Image
                            src={item.item?.image ?? icon}
                            mr="2"
                            alt={item.itemName}
                            width={80}
                            height={80}
                            w="80px"
                            h="80px"
                          />
                          <Button
                            size="xs"
                            variant={'ghost'}
                            colorScheme="red"
                            onClick={() => removeItem(index)}
                          >
                            {t('General.delete')}
                          </Button>
                        </Flex>
                        <Flex
                          flexFlow={'column'}
                          alignItems={'flex-start'}
                          justifyContent={'center'}
                          gap={3}
                        >
                          <Text
                            fontSize={'sm'}
                            as={item.item ? Link : undefined}
                            href={item.item ? `/item/${item.item.slug}` : undefined}
                            isExternal
                          >
                            {item.itemName}
                          </Text>
                          <FormControl size="xs" isRequired>
                            <FormLabel fontSize={'xs'} color="gray.300">
                              {t('Owls.your-cap-personal-value')}
                            </FormLabel>
                            <Input
                              variant="filled"
                              name="personalValue"
                              size="xs"
                              onChange={(e) => handleChange(e, index)}
                              value={item.personalValue}
                            />
                            <FormHelperText fontSize={'xs'}>
                              {t.rich('Owls.pv-helper', {
                                b: (chunk) => <b>{chunk}</b>,
                              })}
                            </FormHelperText>
                          </FormControl>
                          <FormControl size="xs" isRequired>
                            <FormLabel fontSize={'xs'} color="gray.300">
                              {t('General.quantity')}
                            </FormLabel>
                            <Input
                              variant="filled"
                              type="number"
                              min="1"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleChange(e, index)}
                              size="xs"
                            />
                          </FormControl>
                        </Flex>
                      </Flex>
                    ))}
                  </Flex>
                  <ItemSelect
                    creatable
                    placeholder={t('Owls.add-item')}
                    searchFilter={{ type: ['nc'] }}
                    onChange={handleAddItem}
                    limit={20}
                  />
                </>
              )}
              {activeStep === 2 && (
                <>
                  <FormControl size="xs">
                    <FormLabel fontSize={'xs'} color="gray.300">
                      {t('Owls.when-did-this-trade-happen')}
                    </FormLabel>
                    <Input
                      type="date"
                      variant="filled"
                      size="md"
                      value={date || new Date().toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </FormControl>
                  <FormControl size="xs">
                    <FormLabel fontSize={'xs'} color="gray.300">
                      {t('Owls.notes-and-comments-optional')}
                    </FormLabel>
                    <Textarea
                      maxLength={200}
                      variant="filled"
                      size="xs"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <FormHelperText textAlign={'left'} fontSize={'xs'}>
                      {t('Owls.please-send-your-notes-and-comments-in-english')}
                    </FormHelperText>
                  </FormControl>
                </>
              )}
              {activeStep === 3 && (
                <>
                  <OwlsTradeCard
                    trade={tradeReportToOwlsTrade({ offered, received, notes, date })}
                  />
                  <Text fontSize={'xs'} color="gray.500" textAlign="center">
                    {t('Owls.terms-msg')}
                  </Text>
                </>
              )}
            </Flex>
            <Flex gap={3}>
              {activeStep !== 4 && (
                <Button
                  variant={'ghost'}
                  onClick={goToPrevious}
                  isDisabled={activeStep === 0}
                  isLoading={isLoading}
                >
                  {t('General.back')}
                </Button>
              )}
              {activeStep < 3 && (
                <Button colorScheme="green" variant={'ghost'} onClick={validateContinue}>
                  {t('General.next')}
                </Button>
              )}
              {activeStep === 3 && (
                <Button
                  colorScheme="green"
                  variant={'ghost'}
                  onClick={submitTrade}
                  isLoading={isLoading}
                >
                  {t('General.submit')}
                </Button>
              )}
              {activeStep === 4 && (
                <Button colorScheme="blue" variant={'ghost'} onClick={reset}>
                  {t('Owls.send-another-trade')}
                </Button>
              )}
            </Flex>
          </Center>
        </>
      )}
      <Divider my={8} />
      <Flex
        flexFlow={'column'}
        gap={4}
        p={4}
        borderRadius={'md'}
        w="100%"
        maxW="900px"
        sx={{ a: { color: 'blue.300' }, b: { color: 'blue.200' } }}
      >
        <Heading as={'h3'} size="md">
          {t('Owls.faq-1')}
        </Heading>
        <Text fontSize={'sm'} color="gray.300">
          {t.rich('Owls.faq-2', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <Link href="https://www.neopets.com/~Personalvalues" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </Text>
        <Heading as={'h3'} size="md" mt={4}>
          {t('Owls.faq-3')}
        </Heading>
        <Text fontSize={'sm'} color="gray.300">
          {t.rich('Owls.faq-5', {
            br: () => <br />,
            b: (chunk) => <b>{chunk}</b>,
            DTI: (chunk) => (
              <Link href="https://impress.openneo.net/" isExternal>
                {chunk}
              </Link>
            ),
            Eya: (chunk) => (
              <Link href="https://www.neopets.com/~Eya" isExternal>
                {chunk}
              </Link>
            ),
          })}
        </Text>
        <Text fontSize="sm">{t('Owls.faq-4')}</Text>
        <Heading as={'h3'} size="md" mt={4}>
          {t('Owls.faq-6')}
        </Heading>
        <Text fontSize={'sm'} color="gray.300">
          {t.rich('Owls.faq-7', {
            Link: (chunk) => <Link href="/owls">{chunk}</Link>,
          })}
        </Text>
      </Flex>
    </>
  );
};

export default OwlsReportPage;

export async function getServerSideProps(context: any) {
  let user = null;

  try {
    user = (await CheckAuth(context.req)).user;
    if (user?.banned) user = null;
  } catch (e) {}

  return {
    props: {
      user: user,
      messages: (await import(`../../translation/${context.locale}.json`)).default,
      locale: context.locale,
    },
  };
}

OwlsReportPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  const canonical =
    props.locale === 'en'
      ? `https://itemdb.com.br/owls/report`
      : `https://itemdb.com.br/${props.locale}/owls/report`;

  return (
    <Layout
      SEO={{
        title: t('Owls.report-owls-trade'),
        description: t('Owls.description'),
        themeColor: '#47b2f8',
        canonical: canonical,
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/nt/ntimages/309_white_weewoo.gif',
              width: 300,
              height: 300,
              alt: 'Faeries Festival',
            },
          ],
        },
      }}
      mainColor="#47B2F86b"
    >
      {page}
    </Layout>
  );
};

const tradeReportToOwlsTrade = (report: OwlsReport): OwlsTrade => {
  const trade: OwlsTrade = {
    ds: format(new UTCDate(report.date), 'yyyy-MM-dd'),
    notes: report.notes,
    traded: '',
    traded_for: '',
  };

  report.offered.forEach((item, i) => {
    if (i > 0) trade.traded += ' + ';
    if (item.quantity > 1) trade.traded += `${item.quantity}x `;
    trade.traded += `${item.itemName} (${item.personalValue})`;
  });

  report.received.forEach((item, i) => {
    if (i > 0) trade.traded_for += ' + ';
    if (item.quantity > 1) trade.traded_for += `${item.quantity}x `;
    trade.traded_for += `${item.itemName} (${item.personalValue})`;
  });

  return trade;
};
