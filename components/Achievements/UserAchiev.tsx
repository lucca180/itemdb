import { Flex } from '@chakra-ui/react';
import { UserAchievement } from '../../types';
import AchievBadge from './AchievBadge';

type UserAchievProps = {
  achievements: UserAchievement[];
};

const UserAchiev = (props: UserAchievProps) => {
  const { achievements } = props;

  if (!achievements.length) return <></>;

  return (
    <Flex bg="whiteAlpha.200" gap={3} borderRadius={'md'} p={1} px={2}>
      {achievements.map((achiev, i) => (
        <AchievBadge key={i} name={achiev.name} src={achiev.image} />
      ))}
    </Flex>
  );
};

export default UserAchiev;
