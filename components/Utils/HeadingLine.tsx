import { chakra, Text } from '@chakra-ui/react';

const before = {
  content: '""',
  flex: '1 1',
  borderBottom: '1px solid rgba(255, 255, 255, 0.26)',
  margin: 'auto',
};

export default chakra(Text, {
  baseStyle: {
    display: 'flex',
    flexDirection: 'row',
    _before: { ...before, marginRight: '10px' },
    _after: { ...before, marginLeft: '10px' },
  },
});
