// theme.ts

// 1. import `extendTheme` function
import { extendTheme } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// 2. Add your color mode config
// const config: ThemeConfig = {
//   initialColorMode: 'dark',
//   useSystemColorMode: false,
//     fonts: {
//       body: inter.style.fontFamily,
//       heading: inter.style.fontFamily,
//   },
// };

// 3. extend the theme
const theme = extendTheme({
  initialColorMode: 'dark',
  useSystemColorMode: false,
  fonts: {
    body: inter.style.fontFamily,
    heading: inter.style.fontFamily,
  },
});

export default theme;
