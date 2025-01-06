import {
  Center,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Text,
  Link,
} from '@chakra-ui/react';
import Color from 'color';
import { useTranslations } from 'next-intl';
import { ContributeWallData } from '../../types';

type ContributeWallProps = {
  color: string;
  wall: ContributeWallData;
  textType: 'Restock' | 'ItemPage';
};

export const ContributeWall = (props: ContributeWallProps) => {
  const { color, wall, textType } = props;
  const t = useTranslations();

  return (
    <Center>
      <Center
        flexFlow={'column'}
        h="100%"
        minH={'150px'}
        mt={8}
        gap={3}
        maxW="1000px"
        sx={{
          a: { color: Color(color).lightness(70).hex() },
          b: { color: Color(color).lightness(60).hex() },
        }}
      >
        <Text textAlign={'center'} fontSize={'sm'}>
          {t.rich(textType + '.contribute-wall-1', {
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
        <Box bg="blackAlpha.500" p={8} borderRadius={'md'}>
          <Text textAlign={'center'} fontSize={'sm'}>
            {t.rich('Restock.wrapped-precify-text', {
              Link: (chunk) => (
                <Link href="/feedback/trades" isExternal>
                  {chunk}
                </Link>
              ),
              b: (chunk) => <b>{chunk}</b>,
              needTrades: wall.needTrades,
            })}
          </Text>
          <Text textAlign={'center'} fontSize={'sm'}>
            {t.rich('Restock.wrapped-vote-text', {
              Link: (chunk) => (
                <Link href="/feedback/vote" isExternal>
                  {chunk}
                </Link>
              ),
              b: (chunk) => <b>{chunk}</b>,
              needVotes: wall.needVotes,
            })}
          </Text>
        </Box>
        <Text textAlign={'center'} fontSize={'sm'}>
          {t.rich(textType + '.contribute-wall-2', {
            b: (chunk) => <b>{chunk}</b>,
          })}
        </Text>
        <Accordion allowToggle w="100%" mt={5}>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {t('Restock.wrapped-text4')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} fontSize={'sm'}>
              {t.rich('Restock.wrapped-text5', {
                br: () => <br />,
              })}
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {t('Restock.contribute-wall-3')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} fontSize={'sm'}>
              {t.rich('Restock.contribute-wall-4', {
                b: (chunk) => <b>{chunk}</b>,
                br: () => <br />,
              })}
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {t('Restock.contribute-wall-5')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} fontSize={'sm'}>
              {t.rich('Restock.contribute-wall-6', {
                br: () => <br />,
              })}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Center>
    </Center>
  );
};
