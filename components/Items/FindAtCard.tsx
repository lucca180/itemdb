import CardBase from '@components/Card/CardBase';
import React from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import AuctionIcon from '../../public/icons/auction.png';
import ShopIcon from '../../public/icons/shop.svg';
import SDBIcon from '../../public/icons/safetydeposit.svg';
import SWIcon from '../../public/icons/shopwizard.png';
import TPIcon from '../../public/icons/tradingpost.png';
import ClosetIcon from '../../public/icons/closet.svg';
import NeosearchIcon from '../../public/icons/neosearch.svg';
import { useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';

type Props = {
  item: ItemData;
};

const FindAtCard = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const color = item.color.rgb;

  return (
    <CardBase
      title={t('ItemPage.find-at')}
      color={color}
      noPadding
      chakraWrapper={{ minW: '200px', borderRadius: 'md' }}
      chakra={{
        py: 3,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        textAlign: 'center',
      }}
    >
      {item.findAt.shopWizard && (
        <MainLink
          href={item.findAt.shopWizard}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Shop Wizard"
        >
          <Image
            src={SWIcon}
            alt="Shop Wizard"
            title={t('General.shop-wizard')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.auction && (
        <MainLink
          href={item.findAt.auction}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Auction House"
        >
          <Image
            src={AuctionIcon}
            alt="Auction House"
            title={t('General.auction-house')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.trading && (
        <MainLink
          href={item.findAt.trading}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Trading Post"
        >
          <Image
            src={TPIcon}
            alt="Trading Post"
            title={t('General.trading-post')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.safetyDeposit && (
        <MainLink
          href={item.findAt.safetyDeposit}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Safety Deposit Box"
        >
          <Image
            src={SDBIcon}
            alt="Safety Deposit Box"
            title={t('General.safety-deposit-box')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.closet && (
        <MainLink
          href={item.findAt.closet}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Closet"
        >
          <Image
            src={ClosetIcon}
            alt="Closet"
            title={t('General.closet')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.restockShop && (
        <MainLink
          href={item.findAt.restockShop}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Restock Shop"
        >
          <Image
            src={ShopIcon}
            alt="Restock Shop"
            title={t('General.restock-shop')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
      {item.findAt.neosearch && (
        <MainLink
          href={item.findAt.neosearch}
          isExternal
          trackEvent="find-at"
          trackEventLabel="Neopets Search"
        >
          <Image
            src={NeosearchIcon}
            alt="Neopets Search"
            title={t('General.neopets-search')}
            height={32}
            quality="100"
          />
        </MainLink>
      )}
    </CardBase>
  );
};

export default FindAtCard;
