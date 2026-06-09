'use client';

import { Box } from '@chakra-ui/react';
import NextImage from 'next/image';
import logo from '@assets/logo_white_compressed.svg';
import logoIcon from '@assets/logo_icon.svg';

export function LayoutLogoContent() {
  return (
    <>
      <Box display={{ base: 'inline', md: 'none' }}>
        <NextImage
          src={logoIcon}
          alt="itemdb logo"
          height={50}
          style={{ width: 'auto', maxHeight: '50px' }}
        />
      </Box>
      <Box display={{ base: 'none', md: 'inline' }}>
        <NextImage src={logo} alt="itemdb logo" width={175} />
      </Box>
    </>
  );
}
