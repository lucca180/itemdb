import { Flex, Heading, Text, Grid } from '@chakra-ui/react';
import {
  MdAttachMoney,
  MdDescription,
  MdImage,
  MdOutlineSearch,
  MdShowChart,
} from 'react-icons/md';
import FeatureCard from '@components/Card/FeatureCard';
import HeaderCard from '@components/Card/HeaderCard';
import DynamicIcon from '@assets/icons/dynamic.png';
import NextImage from 'next/image';
import type { FaqFeatureCard, FaqPageContentProps } from './buildFaqPageProps';

function FeatureCardIcon({ icon }: { icon: FaqFeatureCard['icon'] }) {
  switch (icon) {
    case 'dynamic':
      return (
        <NextImage
          src={DynamicIcon}
          alt="lightning bolt"
          width={14}
          style={{ display: 'inline' }}
        />
      );
    case 'chart':
      return <MdShowChart fontSize={'24px'} />;
    case 'money':
      return <MdAttachMoney fontSize={'24px'} />;
    case 'search':
      return <MdOutlineSearch fontSize={'24px'} />;
    case 'image':
      return <MdImage fontSize={'24px'} />;
    case 'description':
      return <MdDescription fontSize={'24px'} />;
  }
}

export function FaqPageContent({ content }: { content: FaqPageContentProps }) {
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/desert/usurper_clue.gif',
          alt: 'xweetok agent thumbnail',
        }}
        color="#4bbde0"
      >
        <Heading as="h1" size="lg">
          {content.whyItemdb}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{content.text1}</Text>
      </HeaderCard>
      <Flex
        flexFlow="column"
        gap={3}
        css={{ '& a': { color: 'cyan.400' }, b: { color: 'blue.300' } }}
      >
        <Flex flexFlow="column" gap={3} maxW="1000px">
          <Heading size="md">{content.whatIsItemdb}</Heading>
          <Text>
            {content.text2}
            <br />
            <br />
            {content.text3}
            <br />
            <br />
            {content.text4}
          </Text>
          <Heading size="md" mt={5}>
            {content.isItSafe}
          </Heading>
          <Text>{content.textIsSafe}</Text>
          <Heading size="md" mt={5}>
            {content.whyUseItemdb}
          </Heading>
          <Text>{content.coolFeatures}</Text>
          <Grid templateColumns={['1', 'repeat(2, 2fr)', 'repeat(3, 2fr)']} gap={[2, 3, 6]}>
            {content.featureCards.map((card) => (
              <FeatureCard
                key={card.title}
                title={card.title}
                icon={<FeatureCardIcon icon={card.icon} />}
              >
                <>{card.body}</>
              </FeatureCard>
            ))}
          </Grid>
          <Heading size="md" mt={5}>
            {content.howCanIHelp}
          </Heading>
          <Text>{content.text11}</Text>
          <Heading size="md" mt={5}>
            {content.canITalkOnNeopets}
          </Heading>
          <Text>{content.text12}</Text>
          <Heading size="md" mt={5}>
            {content.missingInfo}
          </Heading>
          <Text>
            {content.text13}
            <br />
            <br />
            {content.text14}
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
