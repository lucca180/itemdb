export type BreadcrumbItem = {
  position: number;
  name: string;
  item: string;
  skip?: boolean;
};

export type BreadcrumbJsonLdItem = BreadcrumbItem & {
  item: string;
};
