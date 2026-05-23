import { Link, LinkProps } from '@chakra-ui/react';
import Image from 'next/image';

const ignoreProps = ['iconWidth', 'iconHeight', 'iconStyle'];

export const IconLink = (
  props: LinkProps & {
    iconWidth?: number | `${number}`;
    iconHeight?: number | `${number}`;
    iconStyle?: React.CSSProperties;
    isExternal?: boolean;
  }
) => {
  if (!props.href) return null;

  const { isExternal, ...rest } = props;

  return (
    <Link
      target={isExternal ? '_blank' : rest.target}
      rel={isExternal ? 'noreferrer' : rest.rel}
      display="inline"
      {...Object.fromEntries(
        Object.entries(rest).filter(([key]) => !ignoreProps.includes(key) && key !== 'isExternal')
      )}
    >
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
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (hostname.endsWith('neopets.com')) return '/icons/neopets.png';
    if (hostname.endsWith('magnetismotimes.com')) return '/icons/mt.png';
    if (hostname.endsWith('itemdb.com.br')) return '/favicon.svg';
    if (hostname.endsWith('openneo.net')) return '/icons/dti.png';
    if (hostname.endsWith('neomerch.com')) return '/icons/merch.png';
  } catch (e) {
    console.error(e);
  }

  return '';
};
