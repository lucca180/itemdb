import { defineRecipe, Button } from '@chakra-ui/react';

export const badgeRecipe = defineRecipe({
  className: 'chakra-badge',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'sm',
    fontSize: 'xs',
    fontWeight: 'bold',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 'normal',
    px: '1',
    textTransform: 'uppercase',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  variants: {
    variant: {
      solid: {
        bg: 'colorPalette.500',
        color: 'white',
        _dark: {
          bg: 'colorPalette.500/60',
          color: 'whiteAlpha.800',
        },
      },
      subtle: {
        bg: 'colorPalette.100',
        color: 'colorPalette.800',
        _dark: {
          bg: 'colorPalette.200/16',
          color: 'colorPalette.200',
        },
      },
      outline: {
        color: 'colorPalette.500',
        shadow: 'inset 0 0 0px 1px currentColor',
        _dark: {
          color: 'colorPalette.200/80',
        },
      },
      surface: {
        bg: 'colorPalette.100',
        color: 'colorPalette.800',
        shadow: 'inset 0 0 0px 1px var(--shadow-color)',
        shadowColor: 'colorPalette.200',
        _dark: {
          bg: 'colorPalette.200/16',
          color: 'colorPalette.200',
          shadowColor: 'colorPalette.200/20',
        },
      },
      plain: {
        color: 'colorPalette.500',
        _dark: {
          color: 'colorPalette.200',
        },
      },
    },
    size: {
      xs: {
        fontSize: '2xs',
        px: '1',
      },
      sm: {
        fontSize: 'xs',
        px: '1',
      },
      md: {
        fontSize: 'sm',
        px: '2',
      },
      lg: {
        fontSize: 'sm',
        px: '2.5',
      },
    },
  },
  defaultVariants: {
    variant: 'subtle',
    colorPalette: 'whiteAlpha',
    size: 'sm',
  },
});

export const inputRecipe = defineRecipe({
  variants: {
    variant: {
      subtle: {
        bg: 'whiteAlpha.50',
      },
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
});

export const buttonRecipe = defineRecipe({
  defaultVariants: {
    // variant: 'subtle',
    colorPalette: 'whiteAlpha',
  },
});
