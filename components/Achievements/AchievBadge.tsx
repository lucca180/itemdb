import { Flex } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import Tooltip from '@components/Utils/Tooltip';

type AchievBadgeProps = {
  name: string;
  src: string;
};

const AchievBadge = (props: AchievBadgeProps) => {
  return (
    <Tooltip label={props.name}>
      <Flex
        maxW="22px"
        maxH="22px"
        overflow="hidden"
        p={0}
        justifyContent="center"
        alignItems="center"
        borderRadius={4}
        cursor="pointer"
      >
        <Image
          src={props.src}
          width={22}
          height={22}
          alt={props.name}
          style={{ width: '22px', height: '22px' }}
        />
      </Flex>
    </Tooltip>
  );
};

export default AchievBadge;
