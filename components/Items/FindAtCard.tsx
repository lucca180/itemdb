import { Box, Flex, Link } from '@chakra-ui/react';
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
    <Flex minW="200px" borderRadius="md" overflow="hidden" flexFlow="column" boxShadow="sm">
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        {t('ItemPage.find-at')}
      </Box>
      <Flex
        py={3}
        px={2}
        bg="gray.600"
        alignItems="center"
        justifyContent="center"
        gap={1}
        textAlign="center"
      >
        {item.findAt.shopWizard && (
          <Link
            as={MainLink}
            href={item.findAt.shopWizard}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Shop Wizard"
            rel="noopener"
          >
            <Image src={SWIcon} alt="Shop Wizard" title="Shop Wizard" height={32} quality="100" />
          </Link>
        )}
        {item.findAt.auction && (
          <Link
            as={MainLink}
            href={item.findAt.auction}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Auction House"
            rel="noopener"
          >
            <Image
              src={AuctionIcon}
              alt="Action House"
              title="Action House"
              height={32}
              quality="100"
            />
          </Link>
        )}
        {item.findAt.trading && (
          <Link
            as={MainLink}
            href={item.findAt.trading}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Trading Post"
            rel="noopener"
          >
            <Image src={TPIcon} alt="Trading Post" title="Trading Post" height={32} quality="100" />
          </Link>
        )}
        {item.findAt.safetyDeposit && (
          <Link
            as={MainLink}
            href={item.findAt.safetyDeposit}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Safety Deposit Box"
            rel="noopener"
          >
            <Image
              src={SDBIcon}
              alt="Safety Deposit Box"
              title="Safety Deposit Box"
              height={32}
              quality="100"
            />
          </Link>
        )}
        {item.findAt.closet && (
          <Link
            as={MainLink}
            href={item.findAt.closet}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Closet"
            rel="noopener"
          >
            <Image src={ClosetIcon} alt="Closet" title="Closet" height={32} quality="100" />
          </Link>
        )}
        {item.findAt.restockShop && (
          <Link
            as={MainLink}
            href={item.findAt.restockShop}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Restock Shop"
            rel="noopener"
          >
            <Image
              src={ShopIcon}
              alt="Restock Shop"
              title="Restock Shop"
              height={32}
              quality="100"
            />
          </Link>
        )}
        {item.findAt.neosearch && (
          <Link
            as={MainLink}
            href={item.findAt.neosearch}
            isExternal
            trackEvent="find-at"
            trackEventLabel="Neopets Search"
            rel="noopener"
          >
            <Image
              src={NeosearchIcon}
              alt="Neopets Search"
              title="Neopets Search"
              height={32}
              quality="100"
            />
          </Link>
        )}
      </Flex>
    </Flex>
  );
};

export default FindAtCard;
