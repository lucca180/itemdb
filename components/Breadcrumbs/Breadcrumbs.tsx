import { BreadcrumbJsonLd } from 'next-seo';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

type BreadcrumbsProps = {
  breadcrumbList: {
    position: number;
    name: string;
    item: string;
  }[];
};

export const Breadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbList } = props;
  const router = useRouter();

  const getLink = (url: string) => {
    const locale = router.locale === 'en' ? '' : `/${router.locale}`;
    return `https://itemdb.com.br${locale}${url}`;
  };

  const formattedBreadcrumbList = breadcrumbList.map((crumb) => ({
    ...crumb,
    item: getLink(crumb.item),
  }));

  return (
    <>
      <Breadcrumb
        spacing="2px"
        fontSize={'xs'}
        separator={<ChevronRightIcon color="whiteAlpha.800" />}
        color="whiteAlpha.800"
      >
        {formattedBreadcrumbList.map((crumb, i) => (
          <BreadcrumbItem key={crumb.position} isCurrentPage={i === breadcrumbList.length - 1}>
            <BreadcrumbLink
              data-umami-event="breadcrumb-link"
              as={i === breadcrumbList.length - 1 ? undefined : NextLink}
              href={removeLink(crumb.item)}
              prefetch={i === breadcrumbList.length - 1 ? undefined : false}
              whiteSpace={'nowrap'}
              overflow={'hidden'}
              textOverflow={'ellipsis'}
              maxW={`${90 / breadcrumbList.length}vw`}
            >
              {crumb.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      <BreadcrumbJsonLd itemListElements={formattedBreadcrumbList} />
    </>
  );
};

const removeLink = (url: string) => {
  return url.replace('https://itemdb.com.br', '');
};
