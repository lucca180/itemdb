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
      'react-hooks/preserve-manual-memoization': 'warn',
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
