import { Flex } from '@chakra-ui/react';

type ShopInfoProps = {
  children: React.ReactNode;
};

export const ShopInfoCard = (props: ShopInfoProps) => {
  return (
    <Flex
      w="200px"
      bg="blackAlpha.400"
      p={2}
      borderRadius={'md'}
      justifyContent={'center'}
      alignItems={'center'}
      textAlign={'center'}
      sx={{ textWrap: 'balance' }}
    >
      {props.children}
    </Flex>
  );
};
