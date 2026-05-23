import { Box, type BoxProps, Flex, type FlexProps } from '@chakra-ui/react';
import Color from 'color';
import React from 'react';

type Props = {
  children?: React.ReactNode;
  title?: React.ReactNode;
  color?: [number, number, number] | number[] | string;
  noPadding?: boolean;
  chakra?: BoxProps;
  chakraTitle?: BoxProps;
  chakraWrapper?: FlexProps;
};

const CardBase = (props: Props) => {
  const rgb =
    typeof props.color === 'string'
      ? Color(props.color).rgb().round().array()
      : props.color || [74, 85, 104];

  return (
    <Flex
      // flex={1}
      // height='100%'
      borderTopRadius="md"
      overflow="hidden"
      flexFlow="column"
      {...props.chakraWrapper}
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        as={'h3'}
        bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, .6)`}
        {...props.chakraTitle}
      >
        {props.title}
      </Box>
      <Box
        p={props.noPadding ? 0 : 3}
        bg="gray.600"
        boxShadow="md"
        // textAlign='center'
        h="100%"
        borderBottomRadius="md"
        {...props.chakra}
      >
        {props.children}
      </Box>
    </Flex>
  );
};

export default CardBase;
