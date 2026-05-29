'use client';

import { chakra } from '@chakra-ui/react';
import { ContextMenuTrigger } from 'rctx-contextmenu';

export const CtxTrigger = chakra(ContextMenuTrigger, {
  base: {
    display: 'inline',
  },
});
