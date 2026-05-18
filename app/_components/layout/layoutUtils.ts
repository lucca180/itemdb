export type LayoutNavOption = {
  label: string;
  href: string;
  newUntil?: number;
};

export type LayoutNavSection = {
  label: string;
  href: string;
  options?: LayoutNavOption[];
};

export function stripLocalePrefix(path: string) {
  return path.replace(/^\/pt(?=\/|$)/, '') || '/';
}

export function getLocalizedPath(path: string, locale: string) {
  const normalizedPath = stripLocalePrefix(path);

  if (locale === 'pt') {
    return `/pt${normalizedPath === '/' ? '' : normalizedPath}`;
  }

  return normalizedPath;
}
