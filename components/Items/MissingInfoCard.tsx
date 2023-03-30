import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Box,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import React from 'react';

const MissingInfoCard = () => {
  return (
    <Alert
      status="error"
      borderRadius="md"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
    >
      <AlertIcon />
      <Box>
        <AlertTitle>We&apos;re missing data!</AlertTitle>
        <AlertDescription>
          <Text fontSize="sm">
            Some information may be wrong as we don&apos;t have enough data about this item
          </Text>
          <Button mt={2} as={Link} href="/contribute" size="sm">
            Learn how to help!
          </Button>
        </AlertDescription>
      </Box>
    </Alert>
  );
};

export default MissingInfoCard;
