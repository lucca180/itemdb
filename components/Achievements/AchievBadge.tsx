import { Tooltip, Flex, Image } from '@chakra-ui/react';

type AchievBadgeProps = {
  name: string;
  src: string;
};

const AchievBadge = (props: AchievBadgeProps) => {
  return (
    <Tooltip hasArrow label={props.name}>
      <Flex
        max-w="32px"
        max-h="32px"
        p={0}
        justifyContent="center"
        alignItems="center"
        borderRadius={4}
        cursor="pointer"
      >
        <Image src={props.src} width={22} height={22} alt="achievment image" />
      </Flex>
    </Tooltip>
  );
};

export default AchievBadge;
