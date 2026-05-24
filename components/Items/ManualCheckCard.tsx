import { Alert, Button, Flex } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ItemData } from '../../types';
import { useAuth } from '../../utils/auth';
import type { ItemPrices, ItemProcess } from '@prisma/generated/client';

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

    let correctInfo = undefined;

    if (action === 'correct' && conflictField) {
      correctInfo = {
        field: conflictField,
        value: item[conflictField as keyof ItemData],
      };
    }

    if (action === 'approve' && conflictField) {
      correctInfo = {
        field: conflictField,
        value: (manualCheck as ItemProcess)[conflictField as keyof ItemProcess],
      };
    }

    const promise = axios
      .post(`/api/admin/manual/${item.internal_id}`, {
        action,
        type: type,
        checkID: manualCheck.internal_id,
        correctInfo: correctInfo,
      })
      .then(() => setManualCheck(null));

    toast.promise(promise, {
      success: { id: 'manual-check-success', title: 'Success', description: 'Thank you' },
      error: {
        id: 'manual-check-error',
        title: 'Something wrong',
        description: 'Please try again later',
      },
      loading: { id: 'manual-check-loading', title: 'Please wait' },
    });
  };

  useEffect(() => {
    if (!user || !user.isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [user, item]);

  if (!user || !user.isAdmin || !manualCheck) return null;

  return (
    <Alert.Root
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      minHeight="200px"
      borderRadius={'md'}
    >
      <Alert.Indicator boxSize="40px" mr={0} />
      <Alert.Content>
        <Alert.Title mt={4} mb={1} fontSize="lg" textTransform={'capitalize'}>
          {type} Manual Check Required
        </Alert.Title>
        {type === 'inflation' && (
          <Alert.Description>
            Please confirm that the new price of{' '}
            <b>{intl.format(((manualCheck as ItemPrices).price as unknown as number) ?? 0)} NP</b>{' '}
            is close to correct for {new Date(manualCheck.addedAt).toLocaleDateString()}
            <Flex mt={3} justifyContent="space-between">
              <Button colorPalette={'red'} variant="ghost" onClick={() => submitAction('reprove')}>
                Reject
              </Button>
              <Button
                colorPalette={'orange'}
                variant="ghost"
                onClick={() => submitAction('not_inflated')}
              >
                Not Inflation
              </Button>
              <Button
                colorPalette={'green'}
                variant="ghost"
                onClick={() => submitAction('approve')}
              >
                Approve
              </Button>
            </Flex>
          </Alert.Description>
        )}
        {type === 'info' && conflictField && (
          <Alert.Description>
            Information conflict for <b>{conflictField}</b> field.
            <br />
            Current: <b>{(item as any)[conflictField]}</b>
            <br />
            Incoming: <b>{(manualCheck as any)[conflictField]}</b>
            <Flex mt={3} justifyContent="space-between">
              <Button colorPalette={'red'} variant="ghost" onClick={() => submitAction('reprove')}>
                Ignore
              </Button>
              <Button
                colorPalette={'orange'}
                variant="ghost"
                onClick={() => submitAction('correct')}
              >
                Current is correct
              </Button>
              <Button
                colorPalette={'green'}
                variant="ghost"
                onClick={() => submitAction('approve')}
              >
                Approve
              </Button>
            </Flex>
          </Alert.Description>
        )}
      </Alert.Content>
    </Alert.Root>
  );
};

export default ManualCheckCard;
