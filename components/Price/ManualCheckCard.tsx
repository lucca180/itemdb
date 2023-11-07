import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import type { ItemPrices } from '@prisma/client';

type Props = {
  item: ItemData;
};

const intl = new Intl.NumberFormat();

const PriceManualCheck = (props: Props) => {
  const { item } = props;
  const { user } = useAuth();
  const [manualCheck, setManualCheck] = useState<ItemPrices | undefined | null>();
  const toast = useToast();

  useEffect(() => {
    if (!user || !user.isAdmin) return;
    init();
  }, [user, item]);

  const init = async () => {
    const res = await axios.get(`/api/admin/manual/${item.internal_id}`);

    if (res.data) {
      setManualCheck(res.data);
    }
  };

  const submitAction = async (action: 'approve' | 'reprove' | 'not_inflated') => {
    if (!user || !user.isAdmin || !manualCheck) return;

    const promise = axios
      .post(`/api/admin/manual/${item.internal_id}`, {
        action,
        type: 'inflation',
        checkID: manualCheck.internal_id,
      })
      .then(() => setManualCheck(null));

    toast.promise(promise, {
      success: { title: 'Success', description: 'Thank you' },
      error: { title: 'Something wrong', description: 'Please try again later' },
      loading: { title: 'Please wait' },
    });
  };

  if (!user || !user.isAdmin || !manualCheck) return null;

  return (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
      borderRadius={'md'}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Inflation Manual Check Required
      </AlertTitle>
      <AlertDescription>
        Please confirm that the new price of <b>{intl.format(manualCheck.price ?? 0)} NP</b> is
        close to correct for {new Date(manualCheck.addedAt).toLocaleDateString()}
        <Flex mt={3} justifyContent="space-between">
          <Button colorScheme={'red'} variant="ghost" onClick={() => submitAction('reprove')}>
            Reject
          </Button>
          <Button
            colorScheme={'orange'}
            variant="ghost"
            onClick={() => submitAction('not_inflated')}
          >
            Not Inflation
          </Button>
          <Button colorScheme={'green'} variant="ghost" onClick={() => submitAction('approve')}>
            Approve
          </Button>
        </Flex>
      </AlertDescription>
    </Alert>
  );
};

export default PriceManualCheck;
