import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import AuctionIcon from '../../public/icons/auction.png';
import ShopIcon from '../../public/icons/shop.svg';
import SDBIcon from '../../public/icons/safetydeposit.svg';
import SWIcon from '../../public/icons/shopwizard.png';
import TPIcon from '../../public/icons/tradingpost.png';
import ClosetIcon from '../../public/icons/closet.svg';

type Props = {
  item: ItemData;
};

const FindAtCard = (props: Props) => {
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
        Find At
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
          <a href={item.findAt.shopWizard} target="_blank" rel="noopener">
            <Image src={SWIcon} alt="Shop Wizard" title="Shop Wizard" height={32} quality="100" />
          </a>
        )}
        {item.findAt.auction && (
          <a href={item.findAt.auction} target="_blank" rel="noopener">
            <Image
              src={AuctionIcon}
              alt="Action House"
              title="Action House"
              height={32}
              quality="100"
            />
          </a>
        )}
        {item.findAt.trading && (
          <a href={item.findAt.trading} target="_blank" rel="noopener">
            <Image src={TPIcon} alt="Trading Post" title="Trading Post" height={32} quality="100" />
          </a>
        )}
        {item.findAt.safetyDeposit && (
          <a href={item.findAt.safetyDeposit} target="_blank" rel="noopener">
            <Image
              src={SDBIcon}
              alt="Safety Deposit Box"
              title="Safety Deposit Box"
              height={32}
              quality="100"
            />
          </a>
        )}
        {item.findAt.closet && (
          <a href={item.findAt.closet} target="_blank" rel="noopener">
            <Image src={ClosetIcon} alt="Closet" title="Closet" height={32} quality="100" />
          </a>
        )}
        {item.findAt.restockShop && (
          <a href={item.findAt.restockShop} target="_blank" rel="noopener">
            <Image
              src={ShopIcon}
              alt="Restock Shop"
              title="Restock Shop"
              height={32}
              quality="100"
            />
          </a>
        )}
      </Flex>
    </Flex>
  );
};

export default FindAtCard;
