import { Link, LinkProps } from '@chakra-ui/react';
import Image from 'next/image';

export const IconLink = (
  props: LinkProps & {
    iconWidth?: number | `${number}`;
    iconHeight?: number | `${number}`;
    iconStyle?: React.CSSProperties;
  }
) => {
  if (!props.href) return null;

  return (
    <Link {...props}>
      {props.children}
      {getIcon(props.href) && (
        <Image
          src={getIcon(props.href)}
          width={props.iconWidth || 18}
          height={props.iconHeight || 18}
          style={
            props.iconStyle ?? { display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }
          }
          alt="link icon"
        />
      )}
    </Link>
  );
};

const getIcon = (url: string) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  if (hostname.endsWith('neopets.com')) return '/icons/neopets.png';
  if (hostname.endsWith('magnetismotimes.com')) return '/icons/mt.png';
  if (hostname.endsWith('itemdb.com.br')) return '/favicon.svg';
  if (hostname.endsWith('openneo.net')) return '/icons/dti.png';
  if (hostname.endsWith('neomerch.com')) return '/icons/merch.png';

  return '';
};
