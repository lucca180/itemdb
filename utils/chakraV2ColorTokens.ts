/**
 * Chakra UI v2 default color tokens.
 * @see https://github.com/chakra-ui/chakra-ui/blob/v2/packages/theme/src/foundations/colors.ts
 * @see https://github.com/chakra-ui/chakra-ui/blob/v2/packages/theme/src/semantic-tokens.ts
 */

type ColorShades = Record<string, string>;

const toColorTokens = (shades: ColorShades) =>
  Object.fromEntries(Object.entries(shades).map(([shade, hex]) => [shade, { value: hex }]));

const with950From900 = (shades: ColorShades) => ({
  ...shades,
  950: shades[950] ?? shades[900],
});

const v2Gray = with950From900({
  50: '#F7FAFC',
  100: '#EDF2F7',
  200: '#E2E8F0',
  300: '#CBD5E0',
  400: '#A0AEC0',
  500: '#718096',
  600: '#4A5568',
  700: '#2D3748',
  800: '#1A202C',
  900: '#171923',
});

const v2WhiteAlpha = with950From900({
  50: 'rgba(255, 255, 255, 0.04)',
  100: 'rgba(255, 255, 255, 0.06)',
  200: 'rgba(255, 255, 255, 0.08)',
  300: 'rgba(255, 255, 255, 0.16)',
  400: 'rgba(255, 255, 255, 0.24)',
  500: 'rgba(255, 255, 255, 0.36)',
  600: 'rgba(255, 255, 255, 0.48)',
  700: 'rgba(255, 255, 255, 0.64)',
  800: 'rgba(255, 255, 255, 0.80)',
  900: 'rgba(255, 255, 255, 0.92)',
});

const v2BlackAlpha = with950From900({
  50: 'rgba(0, 0, 0, 0.04)',
  100: 'rgba(0, 0, 0, 0.06)',
  200: 'rgba(0, 0, 0, 0.08)',
  300: 'rgba(0, 0, 0, 0.16)',
  400: 'rgba(0, 0, 0, 0.24)',
  500: 'rgba(0, 0, 0, 0.36)',
  600: 'rgba(0, 0, 0, 0.48)',
  700: 'rgba(0, 0, 0, 0.64)',
  800: 'rgba(0, 0, 0, 0.80)',
  900: 'rgba(0, 0, 0, 0.92)',
});

/** Primitive color tokens from Chakra v2 defaults. */
export const chakraV2ColorTokens = {
  black: { value: '#000000' },
  white: { value: '#FFFFFF' },
  gray: toColorTokens(v2Gray),
  whiteAlpha: toColorTokens(v2WhiteAlpha),
  blackAlpha: toColorTokens(v2BlackAlpha),
  red: toColorTokens(
    with950From900({
      50: '#FFF5F5',
      100: '#FED7D7',
      200: '#FEB2B2',
      300: '#FC8181',
      400: '#F56565',
      500: '#E53E3E',
      600: '#C53030',
      700: '#9B2C2C',
      800: '#822727',
      900: '#63171B',
    })
  ),
  orange: toColorTokens(
    with950From900({
      50: '#FFFAF0',
      100: '#FEEBC8',
      200: '#FBD38D',
      300: '#F6AD55',
      400: '#ED8936',
      500: '#DD6B20',
      600: '#C05621',
      700: '#9C4221',
      800: '#7B341E',
      900: '#652B19',
    })
  ),
  yellow: toColorTokens(
    with950From900({
      50: '#FFFFF0',
      100: '#FEFCBF',
      200: '#FAF089',
      300: '#F6E05E',
      400: '#ECC94B',
      500: '#D69E2E',
      600: '#B7791F',
      700: '#975A16',
      800: '#744210',
      900: '#5F370E',
    })
  ),
  green: toColorTokens(
    with950From900({
      50: '#F0FFF4',
      100: '#C6F6D5',
      200: '#9AE6B4',
      300: '#68D391',
      400: '#48BB78',
      500: '#38A169',
      600: '#2F855A',
      700: '#276749',
      800: '#22543D',
      900: '#1C4532',
    })
  ),
  teal: toColorTokens(
    with950From900({
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    })
  ),
  blue: toColorTokens(
    with950From900({
      50: '#ebf8ff',
      100: '#bee3f8',
      200: '#90cdf4',
      300: '#63b3ed',
      400: '#4299e1',
      500: '#3182ce',
      600: '#2b6cb0',
      700: '#2c5282',
      800: '#2a4365',
      900: '#1A365D',
    })
  ),
  cyan: toColorTokens(
    with950From900({
      50: '#EDFDFD',
      100: '#C4F1F9',
      200: '#9DECF9',
      300: '#76E4F7',
      400: '#0BC5EA',
      500: '#00B5D8',
      600: '#00A3C4',
      700: '#0987A0',
      800: '#086F83',
      900: '#065666',
    })
  ),
  purple: toColorTokens(
    with950From900({
      50: '#FAF5FF',
      100: '#E9D8FD',
      200: '#D6BCFA',
      300: '#B794F4',
      400: '#9F7AEA',
      500: '#805AD5',
      600: '#6B46C1',
      700: '#553C9A',
      800: '#44337A',
      900: '#322659',
    })
  ),
  pink: toColorTokens(
    with950From900({
      50: '#FFF5F7',
      100: '#FED7E2',
      200: '#FBB6CE',
      300: '#F687B3',
      400: '#ED64A6',
      500: '#D53F8C',
      600: '#B83280',
      700: '#97266D',
      800: '#702459',
      900: '#521B41',
    })
  ),
};

/**
 * Semantic color tokens mapped from Chakra v2 defaults.
 * Palette-specific semantic tokens (gray.solid, red.fg, etc.) keep referencing
 * `{colors.*}` and inherit the v2 primitives above.
 */
export const chakraV2SemanticColorTokens = {
  bg: {
    DEFAULT: {
      value: { _light: '{colors.white}', _dark: '{colors.gray.800}' },
    },
    subtle: {
      value: { _light: '{colors.gray.50}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { _light: '{colors.gray.100}', _dark: '{colors.gray.700}' },
    },
    emphasized: {
      value: { _light: '{colors.gray.200}', _dark: '{colors.gray.700}' },
    },
    inverted: {
      value: { _light: '{colors.black}', _dark: '{colors.white}' },
    },
    panel: {
      value: { _light: '{colors.white}', _dark: '{colors.gray.800}' },
    },
    error: {
      value: { _light: '{colors.red.50}', _dark: '{colors.red.900}' },
    },
    warning: {
      value: { _light: '{colors.orange.50}', _dark: '{colors.orange.900}' },
    },
    success: {
      value: { _light: '{colors.green.50}', _dark: '{colors.green.900}' },
    },
    info: {
      value: { _light: '{colors.blue.50}', _dark: '{colors.blue.900}' },
    },
  },
  fg: {
    DEFAULT: {
      value: { _light: '{colors.gray.800}', _dark: '{colors.whiteAlpha.900}' },
    },
    muted: {
      value: { _light: '{colors.gray.600}', _dark: '{colors.gray.400}' },
    },
    subtle: {
      value: { _light: '{colors.gray.400}', _dark: '{colors.gray.500}' },
    },
    inverted: {
      value: { _light: '{colors.gray.50}', _dark: '{colors.gray.800}' },
    },
    error: {
      value: { _light: '{colors.red.500}', _dark: '{colors.red.400}' },
    },
    warning: {
      value: { _light: '{colors.orange.600}', _dark: '{colors.orange.300}' },
    },
    success: {
      value: { _light: '{colors.green.600}', _dark: '{colors.green.300}' },
    },
    info: {
      value: { _light: '{colors.blue.600}', _dark: '{colors.blue.300}' },
    },
  },
  border: {
    DEFAULT: {
      value: { _light: '{colors.gray.200}', _dark: '{colors.whiteAlpha.300}' },
    },
    muted: {
      value: { _light: '{colors.gray.100}', _dark: '{colors.gray.700}' },
    },
    subtle: {
      value: { _light: '{colors.gray.50}', _dark: '{colors.gray.800}' },
    },
    emphasized: {
      value: { _light: '{colors.gray.300}', _dark: '{colors.gray.600}' },
    },
    inverted: {
      value: { _light: '{colors.gray.800}', _dark: '{colors.gray.200}' },
    },
    error: {
      value: { _light: '{colors.red.500}', _dark: '{colors.red.400}' },
    },
    warning: {
      value: { _light: '{colors.orange.500}', _dark: '{colors.orange.400}' },
    },
    success: {
      value: { _light: '{colors.green.500}', _dark: '{colors.green.400}' },
    },
    info: {
      value: { _light: '{colors.blue.500}', _dark: '{colors.blue.400}' },
    },
  },
};
