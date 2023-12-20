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
          <StatLabel>{label}</StatLabel>
          <StatNumber>{stat}</StatNumber>
          <StatHelpText>{helpText}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};
