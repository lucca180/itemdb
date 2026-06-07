'use client';

import { Alert, Button, Flex } from '@chakra-ui/react';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useRouter } from '@i18n/navigation';
import type { ItemPrices, ItemProcess } from '@prisma/generated/client';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
  type: 'inflation' | 'info';
  manualCheck: ItemPrices | ItemProcess;
  conflictField: string | null;
};

const intl = new Intl.NumberFormat();

export function ManualCheckCard({ item, type, manualCheck, conflictField }: Props) {
  const router = useRouter();
  const toast = useToast();

  const submitAction = async (action: 'approve' | 'reprove' | 'not_inflated' | 'correct') => {
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
        type,
        checkID: manualCheck.internal_id,
        correctInfo: correctInfo,
      })
      .then(() => router.refresh());

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
      bg="red.400/30"
      color="white"
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
            Current: <b>{(item as Record<string, unknown>)[conflictField] as string}</b>
            <br />
            Incoming: <b>{(manualCheck as Record<string, unknown>)[conflictField] as string}</b>
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
}
