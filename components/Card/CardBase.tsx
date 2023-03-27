import { Box, Flex, FlexProps } from '@chakra-ui/react';
import Color from 'color';
import React from 'react';

type Props = {
  children?: React.ReactNode;
  title?: React.ReactNode;
  color?: [number, number, number] | number[] | string;
  noPadding?: boolean;
  chakra?: FlexProps;
  chakraWrapper?: FlexProps;
};

const CardBase = (props: Props) => {
  const color =
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
      boxShadow="sm"
      {...props.chakraWrapper}
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
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
