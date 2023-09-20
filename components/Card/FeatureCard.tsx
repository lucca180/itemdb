import { Avatar, Flex, Heading, Text } from '@chakra-ui/react';

type FeatureCardProps = {
  title: string;
  color?: string;
  children: React.ReactElement | string;
  icon: React.ReactElement;
};

export default function FeatureCard(props: FeatureCardProps) {
  const { title, children, icon, color } = props;
  return (
    <Flex
      flexFlow={'column'}
      padding="30px"
      bg="gray.700"
      borderRadius={'md'}
      gap={3}
      boxShadow="md"
    >
      <Avatar bg={color ?? 'gray.500'} icon={icon} />
      <Heading size="md">{title}</Heading>
      <Text fontSize={'md'} opacity="0.78">
        {children}
      </Text>
    </Flex>
  );
}
