'use client';

import { Alert, Button, Flex, Icon, Tooltip } from '@chakra-ui/react';
import { ManualCheckDiffView } from '@app/_components/Item/ManualCheck/ManualCheckDiffView';
import { useToast } from '@utils/theme/toast';
import axios from 'axios';
import { useRouter } from '@i18n/navigation';
import type { ItemPrices, ItemProcess } from '@prisma/generated/client';
import type { ItemData } from '@types';
import type { ItemProcessDiffEntry } from '@utils/manualCheck/itemProcessDiff';
import { FaInfoCircle } from 'react-icons/fa';

type Props = {
  item: ItemData;
  type: 'inflation' | 'info';
  manualCheck: ItemPrices | ItemProcess;
  conflictField: string | null;
  changes?: ItemProcessDiffEntry[];
};

const intl = new Intl.NumberFormat();

type ActionButtonProps = {
  label: string;
  tooltip: string;
  colorPalette: 'red' | 'orange' | 'green';
  onClick: () => void;
};

function ActionButton({ label, tooltip, colorPalette, onClick }: ActionButtonProps) {
  return (
    <Tooltip.Root positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>
        <Button colorPalette={colorPalette} variant="ghost" onClick={onClick} gap={1.5}>
          {label}
          <Icon asChild boxSize="8px">
            <FaInfoCircle aria-hidden />
          </Icon>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content fontSize="sm" maxW="260px">
          {tooltip}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

export function ManualCheckCard({ item, type, manualCheck, conflictField, changes = [] }: Props) {
  const router = useRouter();
  const toast = useToast();

  const conflictChange = changes.find((change) => change.field === conflictField);
  const hasOtherIncomingData = changes.some((change) => !change.isConflict);

  const submitAction = async (action: 'approve' | 'reprove' | 'not_inflated' | 'correct') => {
    let correctInfo = undefined;

    if (action === 'correct' && conflictField && conflictChange) {
      correctInfo = {
        field: conflictField,
        value: conflictChange.rawCurrent,
      };
    }

    if (action === 'approve' && conflictField && conflictChange) {
      correctInfo = {
        field: conflictField,
        value: conflictChange.rawIncoming,
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
      alignItems="stretch"
      justifyContent="center"
      textAlign="center"
      minHeight="200px"
      borderRadius={'md'}
      bg="red.400/30"
      color="white"
      p={4}
    >
      <Alert.Indicator boxSize="40px" mr={0} alignSelf="center" />
      <Alert.Content w="100%">
        <Alert.Title mt={4} mb={3} fontSize="lg" textTransform={'capitalize'}>
          {type} Manual Check Required
        </Alert.Title>
        {type === 'inflation' && (
          <Alert.Description>
            Please confirm that the new price of{' '}
            <b>{intl.format(((manualCheck as ItemPrices).price as unknown as number) ?? 0)} NP</b>{' '}
            is close to correct for {new Date(manualCheck.addedAt).toLocaleDateString()}
            <Flex mt={3} justifyContent="space-between" gap={2} flexWrap="wrap">
              <ActionButton
                label="Reject"
                colorPalette="red"
                tooltip="This price looks wrong. Remove it and we'll try again later."
                onClick={() => submitAction('reprove')}
              />
              <ActionButton
                label="Not Inflation"
                colorPalette="orange"
                tooltip="The price is fine, but it's not an inflation spike. Save it as the normal new price."
                onClick={() => submitAction('not_inflated')}
              />
              <ActionButton
                label="Approve"
                colorPalette="green"
                tooltip="Yes, this is a real inflation spike. Save it as the item's new price."
                onClick={() => submitAction('approve')}
              />
            </Flex>
          </Alert.Description>
        )}
        {type === 'info' && conflictField && (
          <Alert.Description>
            <ManualCheckDiffView changes={changes} conflictField={conflictField} />
            <Flex mt={4} justifyContent="space-between" gap={2} flexWrap="wrap">
              <ActionButton
                label="Ignore"
                colorPalette="red"
                tooltip="Throw away all of this new data. Nothing from it will be used."
                onClick={() => submitAction('reprove')}
              />
              {hasOtherIncomingData && (
                <ActionButton
                  label="Current is correct"
                  colorPalette="orange"
                  tooltip={`Keep current ${conflictField}, but other new details from this update can still be applied.`}
                  onClick={() => submitAction('correct')}
                />
              )}
              <ActionButton
                label="Approve"
                colorPalette="green"
                tooltip={`Use the new ${conflictField} and update the item.`}
                onClick={() => submitAction('approve')}
              />
            </Flex>
          </Alert.Description>
        )}
      </Alert.Content>
    </Alert.Root>
  );
}
