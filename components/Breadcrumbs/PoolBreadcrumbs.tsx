import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { PetColorData } from '../../pages/tools/rainbow-pool/[[...slug]]';

type PoolBreadcrumbsProps = {
  petColorData: PetColorData | null;
};

export const PoolBreadcrumbs = (props: PoolBreadcrumbsProps) => {
  const { petColorData } = props;
  const t = useTranslations();
  const router = useRouter();

  const breadcrumbList = useMemo(() => {
    const breadList = [
      {
        position: 1,
        name: t('Layout.home'),
        item: '/',
      },
      {
        position: 2,
        name: t('Layout.rainbow-pool-tool'),
        item: '/tools/rainbow-pool',
      },
    ];

    if (petColorData?.speciesName) {
      breadList.push({
        position: breadList.length + 1,
        name: petColorData.speciesName,
        item: `/tools/rainbow-pool/${petColorData.speciesName.toLowerCase()}`,
      });
    }

    if (petColorData?.colorName && !petColorData?.speciesName) {
      breadList.push({
        position: breadList.length + 1,
        name: petColorData.colorName,
        item: `/tools/rainbow-pool/${petColorData.colorName.toLowerCase()}`,
      });
    }

    if (petColorData?.colorName && petColorData?.speciesName) {
      breadList.push({
        position: breadList.length + 1,
        name: `${petColorData.colorName} ${petColorData.speciesName}`,
        item: `/tools/rainbow-pool/${petColorData.speciesName}/${petColorData.colorName}`,
      });
    }

    return breadList;
  }, [petColorData, router.locale, t]);

  return <Breadcrumbs breadcrumbList={breadcrumbList} />;
};
