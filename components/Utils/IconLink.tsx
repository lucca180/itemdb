import { Link, LinkProps } from '@chakra-ui/react';
import Image from 'next/image';
export const IconLink = (props: LinkProps) => {
  if (!props.href) return null;

  return (
    <Link {...props}>
      {props.children}
      {getIcon(props.href) && (
        <Image
          src={getIcon(props.href)}
          width={18}
          height={18}
          style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
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

  return '';
};
