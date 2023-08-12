import { Flex } from '@chakra-ui/react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { UserAchievement } from '../../types';
import AchievBadge from './AchievBadge';

type UserAchievProps = {
  username: string;
};

const UserAchiev = (props: UserAchievProps) => {
  const { username } = props;
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const achiev = await axios.get(`/api/v1/users/${username}/achievements`);
    setAchievements(achiev.data);
  };

  if (!achievements.length) return <></>;

  return (
    <Flex bg="blackAlpha.200" gap={3} borderRadius={4} px={1} py={1}>
      {achievements.map((achiev, i) => (
        <AchievBadge key={i} name={achiev.name} src={achiev.image} />
      ))}
    </Flex>
  );
};

export default UserAchiev;
