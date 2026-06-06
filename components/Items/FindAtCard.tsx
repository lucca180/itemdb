import CardBase from '@components/Card/CardBase';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';
import AuctionIcon from '@assets/icons/auction.png';
import ShopIcon from '@assets/icons/shop.svg';
import SDBIcon from '@assets/icons/safetydeposit.svg';
import SWIcon from '@assets/icons/shopwizard.png';
import TPIcon from '@assets/icons/tradingpost.png';
import ClosetIcon from '@assets/icons/closet.svg';
import NeosearchIcon from '@assets/icons/neosearch.svg';

type Props = {
  item: ItemData;
};

type FindAtLinkProps = {
  href: string;
  label: string;
  title: string;
  icon: typeof SWIcon;
  alt: string;
};

function FindAtLink({ href, label, title, icon, alt }: FindAtLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-umami-event="find-at"
      data-umami-event-label={label}
    >
      <Image src={icon} alt={alt} title={title} height={32} quality={100} />
    </a>
  );
}

export default async function FindAtCard(props: Props) {
  const t = await getTranslations();
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
        <FindAtLink
          href={item.findAt.shopWizard}
          label="Shop Wizard"
          title={t('General.shop-wizard')}
          icon={SWIcon}
          alt="Shop Wizard"
        />
      )}
      {item.findAt.auction && (
        <FindAtLink
          href={item.findAt.auction}
          label="Auction House"
          title={t('General.auction-house')}
          icon={AuctionIcon}
          alt="Auction House"
        />
      )}
      {item.findAt.trading && (
        <FindAtLink
          href={item.findAt.trading}
          label="Trading Post"
          title={t('General.trading-post')}
          icon={TPIcon}
          alt="Trading Post"
        />
      )}
      {item.findAt.safetyDeposit && (
        <FindAtLink
          href={item.findAt.safetyDeposit}
          label="Safety Deposit Box"
          title={t('General.safety-deposit-box')}
          icon={SDBIcon}
          alt="Safety Deposit Box"
        />
      )}
      {item.findAt.closet && (
        <FindAtLink
          href={item.findAt.closet}
          label="Closet"
          title={t('General.closet')}
          icon={ClosetIcon}
          alt="Closet"
        />
      )}
      {item.findAt.restockShop && (
        <FindAtLink
          href={item.findAt.restockShop}
          label="Restock Shop"
          title={t('General.restock-shop')}
          icon={ShopIcon}
          alt="Restock Shop"
        />
      )}
      {item.findAt.neosearch && (
        <FindAtLink
          href={item.findAt.neosearch}
          label="Neopets Search"
          title={t('General.neopets-search')}
          icon={NeosearchIcon}
          alt="Neopets Search"
        />
      )}
    </CardBase>
  );
}
