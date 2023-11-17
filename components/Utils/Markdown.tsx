import { Link } from '@chakra-ui/react';
import Image from 'next/image';
import MarkdownLib from 'react-markdown';

type MarkdownProps = {
  // components?: any
  children: string;
};

export default function Markdown(props: MarkdownProps) {
  return (
    <MarkdownLib
      urlTransform={(url) => decodeURI(url)}
      disallowedElements={['img']}
      components={{
        a: (props) => {
          if (checkURL(props.href ?? ''))
            return (
              <Link href={props.href} isExternal>
                {props.children}
                {genIcon(props.href ?? '') && (
                  <Image
                    src={genIcon(props.href ?? '')}
                    width={16}
                    height={16}
                    style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                    alt="link icon"
                  />
                )}
              </Link>
            );
          return <>{props.children}</>;
        },
      }}
    >
      {props.children}
    </MarkdownLib>
  );
}

const checkURL = (url: string) => {
  const allowedDomains = ['neopets.com', 'itemdb.com.br', 'magnetismotimes.com'];
  const urlObj = new URL(url);
  //check if the url is from domain (excluding subdomains)

  return allowedDomains.some((domain) => urlObj.hostname.endsWith(domain));
};

const genIcon = (url: string) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  if (hostname.endsWith('neopets.com')) return '/icons/neopets.png';
  if (hostname.endsWith('magnetismotimes.com')) return '/icons/mt.png';
  if (hostname.endsWith('itemdb.com.br')) return '/favicon.svg';

  return '';
};
