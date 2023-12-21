import { Card, CardBody, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';
import { ReactNode } from 'react';

type StatsCardProps = {
  label: string | ReactNode;
  stat: string | ReactNode;
  helpText?: string | ReactNode;
};

export const StatsCard = (props: StatsCardProps) => {
  const { label, stat, helpText } = props;

  return (
    <Card variant="outline" bg="blackAlpha.500">
      <CardBody>
        <Stat>
          <StatLabel fontSize={['xs', 'sm']}>{label}</StatLabel>
          <StatNumber fontSize={['xl', '2xl']}>{stat}</StatNumber>
          <StatHelpText fontSize={['xs', 'sm']}>{helpText}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};
