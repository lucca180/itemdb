import { resolvePageLocale } from '@utils/locales';
import { ReactElement, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Separator,
  Flex,
  Field,
  Heading,
  Input,
  Steps,
  Text,
  Textarea,
  Link,
} from '@chakra-ui/react';
import { BsCheckCircleFill } from 'react-icons/bs';
import Layout from '@components/Layout';
import MainLink from '@components/Utils/MainLink';
import HeaderCard from '@components/Card/HeaderCard';
import { createTranslator, useTranslations } from 'next-intl';
import { ItemData, LebronTrade, NCTradeItem, NCTradeReport, User } from '@types';
import Image from '@components/Utils/Image';
import icon from '@assets/logo_icon.svg';
import { format } from 'date-fns';
import { NCTradeCard } from '@components/NCTrades/NCTradeHistory';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { CheckAuth } from '@utils/googleCloud';
import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';
import { UTCDate } from '@date-fns/utc';

const ItemSelect = dynamic(() => import('@components/Input/ItemSelect'), {
  ssr: false,
  loading: () => <Input variant="subtle" placeholder="Add Item" />,
});

type NcTradeReportPageProps = {
  user: User | null;
};

const NcTradeReportPage = (props: NcTradeReportPageProps) => {
  const { user } = props;
  const t = useTranslations();

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/altador/altadorcup/h5/images/hauntedwoods/player1.png',
          alt: 'owls thumbnail',
        }}
        color="#FDB927"
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
                name: 'Mall',
                item: '/mall',
              },
              {
                position: 3,
                name: 'Report Trade',
                item: '/mall/report',
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
      <NCTradeReportCard user={user} />
      <Separator my={8} />
      <Flex
        flexFlow={'column'}
        gap={4}
        p={4}
        borderRadius={'md'}
        w="100%"
        maxW="900px"
        css={{ '& a': { color: 'yellow.300' }, b: { color: 'orange.200' } }}
      >
        <Heading as={'h3'} size="md">
          {t('Owls.faq-1')}
        </Heading>
        <Text fontSize={'sm'} color="gray.300">
          {t.rich('Owls.faq-2', {
            b: (chunk) => <b>{chunk}</b>,
            Link: (chunk) => (
              <Link href="https://www.neopets.com/~Personalvalues" target="_blank" rel="noreferrer">
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
              <Link href="https://impress.openneo.net/" target="_blank" rel="noreferrer">
                {chunk}
              </Link>
            ),
            Eya: (chunk) => (
              <Link href="https://www.neopets.com/~Eya" target="_blank" rel="noreferrer">
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
            Link: (chunk) => <MainLink href="/articles/lebron">{chunk}</MainLink>,
          })}
        </Text>
      </Flex>
    </>
  );
};

export default NcTradeReportPage;

export async function getServerSideProps(context: any) {
  const locale = resolvePageLocale(context.params?.locale as string);
  let user = null;

  try {
    user = (await CheckAuth(context.req)).user;
    if (user?.banned) user = null;
  } catch (e) {}

  return {
    props: {
      user: user,
      messages: await loadTranslation(locale as string, 'mall/report'),
      locale: locale,
    },
  };
}

NcTradeReportPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  const canonical =
    props.locale === 'en'
      ? `https://itemdb.com.br/mall/report`
      : `https://itemdb.com.br/${props.locale}/mall/report`;

  return (
    <Layout
      SEO={{
        title: t('Owls.report-owls-trade'),
        description: t('Owls.description'),
        themeColor: '#FDB927',
        canonical: canonical,
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/altador/altadorcup/h5/images/hauntedwoods/player1.png',
              width: 300,
              height: 300,
              alt: 'White Weewoo',
            },
          ],
        },
      }}
      mainColor="#cd9c33"
    >
      {page}
    </Layout>
  );
};

type NCTradeReportProps = {
  user: User | null;
};

const NCTradeReportCard = (props: NCTradeReportProps) => {
  const { user } = props;
  const t = useTranslations();

  const steps = [
    { title: t('Owls.you-offered') },
    { title: t('Owls.you-received') },
    { title: t('Owls.notes-and-comments') },
    { title: t('Owls.confirm') },
    { title: t('Owls.success') },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const goToNext = () => setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  const goToPrevious = () => setActiveStep((step) => Math.max(step - 1, 0));
  const [offered, setOffered] = useState<NCTradeItem[]>([]);
  const [received, setReceived] = useState<NCTradeItem[]>([]);
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
      const res = await axios.post('/api/v1/mall/trades', { offered, received, notes, date });

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
            <Steps.Root
              w="100%"
              minW="900px"
              size="sm"
              step={activeStep}
              onStepChange={(e) => setActiveStep(e.step)}
              count={steps.length}
              colorPalette="yellow"
            >
              <Steps.List>
                {steps.map((step, index) => (
                  <Steps.Item key={index} index={index}>
                    <Steps.Indicator>
                      <Steps.Status
                        complete={<BsCheckCircleFill />}
                        incomplete={<Steps.Number />}
                      />
                    </Steps.Indicator>
                    <Box flexShrink="0">
                      <Steps.Title>{step.title}</Steps.Title>
                    </Box>
                    <Steps.Separator />
                  </Steps.Item>
                ))}
              </Steps.List>
            </Steps.Root>
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
                            colorPalette="red"
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
                          {item.item ? (
                            <Link asChild fontSize="sm">
                              <MainLink href={`/item/${item.item.slug}`} prefetch={false}>
                                {item.itemName}
                              </MainLink>
                            </Link>
                          ) : (
                            <Text fontSize="sm">{item.itemName}</Text>
                          )}
                          <Field.Root required>
                            <Field.Label fontSize="xs" color="gray.300">
                              {t('Owls.your-cap-personal-value')}
                            </Field.Label>
                            <Input
                              variant="subtle"
                              name="personalValue"
                              size="xs"
                              onChange={(e) => handleChange(e, index)}
                              value={item.personalValue}
                            />
                            <Field.HelperText fontSize="xs">
                              {t.rich('Owls.pv-helper', {
                                b: (chunk) => <b>{chunk}</b>,
                              })}
                            </Field.HelperText>
                          </Field.Root>
                          <Field.Root required>
                            <Field.Label fontSize="xs" color="gray.300">
                              {t('General.quantity')}
                            </Field.Label>
                            <Input
                              variant="subtle"
                              type="number"
                              min="1"
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => handleChange(e, index)}
                              size="xs"
                            />
                          </Field.Root>
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
                  <Field.Root>
                    <Field.Label fontSize="xs" color="gray.300">
                      {t('Owls.when-did-this-trade-happen')}
                    </Field.Label>
                    <Input
                      type="date"
                      variant="subtle"
                      size="md"
                      value={date || new Date().toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="xs" color="gray.300">
                      {t('Owls.notes-and-comments-optional')}
                    </Field.Label>
                    <Textarea
                      maxLength={200}
                      variant="subtle"
                      size="xs"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Field.HelperText textAlign="left" fontSize="xs">
                      {t('Owls.please-send-your-notes-and-comments-in-english')}
                    </Field.HelperText>
                  </Field.Root>
                </>
              )}
              {activeStep === 3 && (
                <>
                  <NCTradeCard
                    trade={tradeReportToLebronTrade({ offered, received, notes, date })}
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
                  disabled={activeStep === 0}
                  loading={isLoading}
                >
                  {t('General.back')}
                </Button>
              )}
              {activeStep < 3 && (
                <Button colorPalette="orange" variant={'ghost'} onClick={validateContinue}>
                  {t('General.next')}
                </Button>
              )}
              {activeStep === 3 && (
                <Button
                  colorPalette="orange"
                  variant={'ghost'}
                  onClick={submitTrade}
                  loading={isLoading}
                >
                  {t('General.submit')}
                </Button>
              )}
              {activeStep === 4 && (
                <Button colorPalette="yellow" variant={'ghost'} onClick={reset}>
                  {t('Owls.send-another-trade')}
                </Button>
              )}
            </Flex>
          </Center>
        </>
      )}
    </>
  );
};

export const tradeReportToLebronTrade = (report: NCTradeReport): LebronTrade => {
  const trade: LebronTrade = {
    tradeDate: new UTCDate(report.date).getTime(),
    notes: report.notes,
    itemsSent: '',
    itemsReceived: '',
  };

  report.offered.forEach((item, i) => {
    if (i > 0) trade.itemsSent += ' + ';
    if (item.quantity > 1) trade.itemsSent += `${item.quantity}x `;
    trade.itemsSent += `${item.itemName} (${item.personalValue})`;
  });

  report.received.forEach((item, i) => {
    if (i > 0) trade.itemsReceived += ' + ';
    if (item.quantity > 1) trade.itemsReceived += `${item.quantity}x `;
    trade.itemsReceived += `${item.itemName} (${item.personalValue})`;
  });

  return trade;
};
