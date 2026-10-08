import { Link, LinkProps } from '@chakra-ui/react';
import { Link as I18nLink } from '@i18n/navigation';
import Image from 'next/image';

const ignoreProps = ['iconWidth', 'iconHeight', 'iconStyle'];

type IconLinkProps = LinkProps & {
  iconWidth?: number | `${number}`;
  iconHeight?: number | `${number}`;
  iconStyle?: React.CSSProperties;
  isExternal?: boolean;
  hideIcon?: boolean;
};

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export const IconLink = (props: IconLinkProps) => {
  if (!props.href) return null;

  const { isExternal, href, children, iconWidth, iconHeight, iconStyle, hideIcon, ...rest } = props;
  const hrefString = String(href);
  const external = isExternal ?? !isInternalHref(hrefString);

  const linkProps = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !ignoreProps.includes(key) && key !== 'isExternal')
  );

  const icon =
    !hideIcon && getIcon(hrefString) ? (
      <Image
        src={getIcon(hrefString)}
        width={iconWidth || 18}
        height={iconHeight || 18}
        style={iconStyle ?? { display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
        alt="link icon"
      />
    ) : null;

  if (external) {
    return (
      <Link href={hrefString} target="_blank" rel="noreferrer" display="inline" {...linkProps}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <Link asChild display="inline" {...linkProps}>
      <I18nLink href={hrefString}>
        {children}
        {icon}
      </I18nLink>
    </Link>
  );
};

const getIcon = (url: string) => {
  try {
    const urlObj = new URL(url, 'https://itemdb.com.br');
    const hostname = urlObj.hostname;
    const isHost = (domain: string) => hostname === domain || hostname.endsWith(`.${domain}`);
    if (isHost('neopets.com')) return '/icons/neopets.png';
    if (isHost('magnetismotimes.com')) return '/icons/mt.png';
    if (isHost('itemdb.com.br')) return '/favicon.svg';
    if (isHost('openneo.net')) return '/icons/dti.png';
    if (isHost('neomerch.com')) return '/icons/merch.png';
  } catch (e) {
    console.error(e);
  }

  return '';
};
