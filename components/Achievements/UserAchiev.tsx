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
    <Flex bg="blackAlpha.200" gap={3} borderRadius={4} p={1}>
      {achievements.map((achiev, i) => (
        <AchievBadge key={i} name={achiev.name} src={achiev.image} />
      ))}
    </Flex>
  );
};

export default UserAchiev;
