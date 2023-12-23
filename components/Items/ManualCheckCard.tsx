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
import type { ItemPrices, ItemProcess } from '@prisma/client';

type Props = {
  item: ItemData;
};

const intl = new Intl.NumberFormat();

const ManualCheckCard = (props: Props) => {
  const { item } = props;
  const { user } = useAuth();
  const [manualCheck, setManualCheck] = useState<ItemPrices | ItemProcess | undefined | null>();
  const [type, setType] = useState<'inflation' | 'info'>();
  const [conflictField, setConflictField] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!user || !user.isAdmin) return;
    init();
  }, [user, item]);

  const init = async () => {
    const res = await axios.get(`/api/admin/manual/${item.internal_id}`);

    if (res.data.inflation) {
      setManualCheck(res.data.inflation);
      setType('inflation');
    } else if (res.data.info) {
      setManualCheck(res.data.info);
      setType('info');
      const field =
        (res.data.info as ItemProcess).manual_check?.split('Merge')[0].split("'")[1] ?? null;
      setConflictField(field);
    }
  };

  const submitAction = async (action: 'approve' | 'reprove' | 'not_inflated' | 'correct') => {
    if (!user || !user.isAdmin || !manualCheck) return;

    const promise = axios
      .post(`/api/admin/manual/${item.internal_id}`, {
        action,
        type: type,
        checkID: manualCheck.internal_id,
        correctInfo:
          action === 'correct' && conflictField
            ? {
                field: conflictField,
                value: item[conflictField as keyof ItemData],
              }
            : undefined,
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
      minHeight="200px"
      borderRadius={'md'}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg" textTransform={'capitalize'}>
        {type} Manual Check Required
      </AlertTitle>
      {type === 'inflation' && (
        <AlertDescription>
          Please confirm that the new price of{' '}
          <b>{intl.format((manualCheck as ItemPrices).price ?? 0)} NP</b> is close to correct for{' '}
          {new Date(manualCheck.addedAt).toLocaleDateString()}
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
      )}
      {type === 'info' && conflictField && (
        <AlertDescription>
          Information conflict for <b>{conflictField}</b> field.
          <br />
          Current: <b>{(item as any)[conflictField]}</b>
          <br />
          Incoming: <b>{(manualCheck as any)[conflictField]}</b>
          <Flex mt={3} justifyContent="space-between">
            <Button colorScheme={'red'} variant="ghost" onClick={() => submitAction('reprove')}>
              Ignore
            </Button>
            <Button colorScheme={'orange'} variant="ghost" onClick={() => submitAction('correct')}>
              Current is correct
            </Button>
            <Button colorScheme={'green'} variant="ghost" onClick={() => submitAction('approve')}>
              Mark as Solved
            </Button>
          </Flex>
        </AlertDescription>
      )}
    </Alert>
  );
};

export default ManualCheckCard;
