import { BreadcrumbJsonLd } from 'next-seo';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import NextLink from 'next/link';

type BreadcrumbsProps = {
  breadcrumbList: {
    position: number;
    name: string;
    item: string;
  }[];
};

export const Breadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbList } = props;

  return (
    <>
      <Breadcrumb
        spacing="2px"
        fontSize={'xs'}
        separator={<ChevronRightIcon color="whiteAlpha.800" />}
        color="whiteAlpha.800"
      >
        {breadcrumbList.map((crumb, i) => (
          <BreadcrumbItem key={crumb.position} isCurrentPage={i === breadcrumbList.length - 1}>
            <BreadcrumbLink
              as={i === breadcrumbList.length - 1 ? undefined : NextLink}
              href={removeLink(crumb.item)}
            >
              {crumb.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      <BreadcrumbJsonLd itemListElements={breadcrumbList} />
    </>
  );
};

const removeLink = (url: string) => {
  return url.replace('https://itemdb.com.br', '');
};
