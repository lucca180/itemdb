import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

const { Link: LinkRaw, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

const Link = (props: any) => <LinkRaw {...props} prefetch={props.prefetch ?? false} />;

export { Link, redirect, usePathname, useRouter, getPathname };
