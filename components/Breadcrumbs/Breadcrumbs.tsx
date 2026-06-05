import { Fragment } from 'react';
import { BreadcrumbJsonLd } from 'next-seo';
import { ChevronRightIcon } from '@utils/theme/chakraIcons';
import { Breadcrumb } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import { useLocale } from 'next-intl';
import { getLocalizedHref, type AppLocale } from '@utils/locales';

type BreadcrumbsProps = {
  breadcrumbList: {
    position: number;
    name: string;
    item: string;
    skip?: boolean;
  }[];
  linkLast?: boolean;
  useAppDir?: boolean;
};

export const Breadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbList, linkLast = false, useAppDir = false } = props;
  const locale = useLocale() as AppLocale;

  const formattedBreadcrumbList = breadcrumbList.map((crumb) => ({
    ...crumb,
    item: `https://itemdb.com.br${getLocalizedHref(crumb.item, locale)}`,
  }));

  return (
    <>
      <Breadcrumb.Root color="whiteAlpha.800">
        <Breadcrumb.List fontSize={'xs'} gap="2px">
          {formattedBreadcrumbList.map((crumb, i) => (
            <Fragment key={crumb.position}>
              <Breadcrumb.Item display={crumb.skip ? 'none' : undefined}>
                {i === breadcrumbList.length - 1 && !linkLast ? (
                  <Breadcrumb.CurrentLink
                    whiteSpace={'nowrap'}
                    overflow={'hidden'}
                    textOverflow={'ellipsis'}
                    maxW={`${90 / breadcrumbList.length}vw`}
                  >
                    {crumb.name}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link
                    asChild
                    whiteSpace={'nowrap'}
                    overflow={'hidden'}
                    textOverflow={'ellipsis'}
                    maxW={`${90 / breadcrumbList.length}vw`}
                    color="whiteAlpha.700"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    <MainLink
                      href={breadcrumbList[i].item}
                      prefetch={false}
                      trackEvent="breadcrumb-link"
                      trackEventLabel={crumb.name}
                    >
                      {crumb.name}
                    </MainLink>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
              {i < formattedBreadcrumbList.length - 1 && (
                <Breadcrumb.Separator>
                  <ChevronRightIcon color="whiteAlpha.800" />
                </Breadcrumb.Separator>
              )}
            </Fragment>
          ))}
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <BreadcrumbJsonLd itemListElements={formattedBreadcrumbList} useAppDir={useAppDir} />
    </>
  );
};
