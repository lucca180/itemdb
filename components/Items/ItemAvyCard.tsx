import { Flex, Text } from '@chakra-ui/react';
import { AvyData, ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import { useTranslations } from 'next-intl';
import Image from '@components/Utils/Image';
import dynamic from 'next/dynamic';
import Link from '@components/Utils/MainLink';

const Markdown = dynamic(() => import('../Utils/Markdown'));

type Props = {
  item: ItemData;
  avyData: AvyData[];
};

const AvyCard = (props: Props) => {
  const t = useTranslations();
  const { item, avyData } = props;
  const color = item.color.rgb;

  return (
    <CardBase title={t('ItemPage.avatars')} color={color}>
      <Flex gap={3} flexFlow={'column'}>
        {avyData.map((avy) => (
          <Avy key={avy.name} avy={avy} />
        ))}
      </Flex>
    </CardBase>
  );
};

export default AvyCard;

const Avy = (props: { avy: AvyData }) => {
  const { avy } = props;
  const t = useTranslations();

  return (
    <Flex
      gap={2}
      bg="blackAlpha.500"
      p={3}
      borderRadius={'md'}
      alignItems={'center'}
      fontSize={'sm'}
    >
      <Image src={avy.img} alt={avy.name} width={30} height={30} unoptimized />
      <Flex
        flexFlow={'column'}
        gap={1}
        sx={{ a: { color: 'whiteAlpha.800' }, 'a:hover': { textDecoration: 'underline' } }}
      >
        <Text fontWeight={'semibold'}>{avy.name}</Text>
        <Text fontSize={'xs'} color="whiteAlpha.600" as="div">
          <Markdown>{avy.solution}</Markdown>
        </Text>
        {avy.list && (
          <Text fontSize={'xs'}>
            <Link href={`/lists/official/${avy.list.slug}`}>{t('ItemPage.item-list')}</Link>
          </Text>
        )}
      </Flex>
    </Flex>
  );
};
