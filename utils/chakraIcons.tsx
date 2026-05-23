import { forwardRef } from 'react';
import { Icon, type IconProps } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import {
  LuChevronDown,
  LuChevronRight,
  LuExternalLink,
  LuMinus,
  LuSearch,
  LuX,
} from 'react-icons/lu';

function createChakraIcon(icon: IconType) {
  return forwardRef<SVGSVGElement, IconProps>(function ChakraIcon(props, ref) {
    return <Icon ref={ref} as={icon} {...props} />;
  });
}

export const ChevronDownIcon = createChakraIcon(LuChevronDown);
export const ChevronRightIcon = createChakraIcon(LuChevronRight);
export const CloseIcon = createChakraIcon(LuX);
export const ExternalLinkIcon = createChakraIcon(LuExternalLink);
export const MinusIcon = createChakraIcon(LuMinus);
export const SearchIcon = createChakraIcon(LuSearch);
