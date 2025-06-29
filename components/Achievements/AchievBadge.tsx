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
        max-w="32px"
        max-h="32px"
        p={0}
        justifyContent="center"
        alignItems="center"
        borderRadius={4}
        cursor="pointer"
      >
        <Image src={props.src} width={22} height={22} alt="achievement image" />
      </Flex>
    </Tooltip>
  );
};

export default AchievBadge;
