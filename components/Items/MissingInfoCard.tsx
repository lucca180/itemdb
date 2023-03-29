import { Alert, AlertDescription, AlertIcon, AlertTitle, Button } from '@chakra-ui/react';
import Link from 'next/link';
import React from 'react';

const MissingInfoCard = () => {
  return (
    <Alert status="error" borderRadius="md">
      <AlertIcon />
      <AlertTitle>We&apos;re missing some item info!</AlertTitle>
      <AlertDescription>
        <Button as={Link} href="/contribute" size="sm" verticalAlign="baseline">
          Learn how to help!
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default MissingInfoCard;
