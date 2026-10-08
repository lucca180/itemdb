// @ts-check

import nextConfig from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier';
// import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';

export default [
  ...nextConfig,
  prettierConfig,
  // reactYouMightNotNeedAnEffect.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'off',
      'react/no-children-prop': 'off',
      // 'react-hooks/preserve-manual-memoization': 'warn',
      'prefer-const': [
        'error',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: false,
        },
      ],
    },
  },
  {
    // Stricter in eslint-plugin-react-hooks 7.1; fix gradually.
    // Same glob as eslint-config-next, which registers the react-hooks plugin.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-render': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    ignores: [
      'userscripts/**',
      'utils/views/**',
      'prisma/generated/**',
      'public/**',
      'eslint.config.mjs',
      'pages/api/_dev',
    ],
  },
];
