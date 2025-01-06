import { Flex, SkeletonText, Text } from '@chakra-ui/react';
import { useFormatter } from 'next-intl';

type SeenHistoryStatusCardProps = {
  title: string;
  status?: string | number;
  loading?: boolean;
};

export const SeenHistoryStatusCard = (props: SeenHistoryStatusCardProps) => {
  const format = useFormatter();
  return (
    <Flex
      flexFlow={'column'}
      fontSize={'sm'}
      bg="gray.700"
      p={2}
      borderRadius={'md'}
      textAlign={'center'}
      justifyContent={'center'}
      flex="1"
    >
      <Text>{props.title}</Text>
      <Text as="div" opacity={0.8} mt={1}>
        {!props.loading &&
          props.status &&
          (isNaN(Number(props.status)) ? props.status : format.number(props.status as number))}
        {props.loading && <SkeletonText noOfLines={1} skeletonHeight="3" />}
      </Text>
    </Flex>
  );
};
