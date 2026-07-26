export type BreadcrumbItem = {
  position: number;
  name: string;
  item: string;
  skip?: boolean;
  /** HTML rel=nofollow; also excluded from BreadcrumbList JSON-LD. */
  nofollow?: boolean;
};

export type BreadcrumbJsonLdItem = BreadcrumbItem & {
  item: string;
};
