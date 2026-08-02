'use client';

import { IconButton, Tooltip } from '@chakra-ui/react';
import { FaShareAlt } from 'react-icons/fa';
import { useToast } from '@utils/theme/toast';

type ShareLinkButtonProps = {
  label: string;
  toastTitle: string;
};

export function ShareLinkButton({ label, toastTitle }: ShareLinkButtonProps) {
  const toast = useToast();

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);

    toast({
      id: 'rainbow-pool-copy-link',
      title: toastTitle,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Tooltip.Root positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>
        <IconButton
          onClick={copyLink}
          data-umami-event="copy-link"
          bg="blackAlpha.400"
          size="sm"
          variant="subtle"
          aria-label={label}
        >
          <FaShareAlt />
        </IconButton>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
