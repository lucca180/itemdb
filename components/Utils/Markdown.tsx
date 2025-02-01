import MarkdownLib from 'react-markdown';
import { IconLink } from './IconLink';

type MarkdownProps = {
  // components?: any
  children: string;
};

export default function Markdown(props: MarkdownProps) {
  return (
    <MarkdownLib
      urlTransform={(url) => decodeURI(url)}
      allowedElements={['a', 'b', 'i', 'p', 'span', 's', 'br', 'strong', 'em']}
      components={{
        a: (props) => {
          if (checkURL(props.href ?? ''))
            return (
              <IconLink
                key={props.href}
                href={props.href}
                isExternal
                iconHeight={16}
                iconWidth={16}
              >
                {props.children}
              </IconLink>
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
  const allowedDomains = [
    'neopets.com',
    'itemdb.com.br',
    'magnetismotimes.com',
    'openneo.net',
    'neomerch.com',
  ];

  const urlObj = new URL(url);
  //check if the url is from domain (excluding subdomains)

  return allowedDomains.some((domain) => urlObj.hostname.endsWith(domain));
};
