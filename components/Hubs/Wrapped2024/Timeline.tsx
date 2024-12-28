import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { RestockStats } from '../../../types';
import { useFormatter } from 'next-intl';
import { FaCalendar } from 'react-icons/fa';
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import RestockItem from '../Restock/RestockItemCard';

type WrappedTimelineProps = {
  wrappedData: RestockStats;
  monthlyData: RestockStats[];
};

const mainColor = '#5C8374';

const WrappedTimeline = (props: WrappedTimelineProps) => {
  const { wrappedData, monthlyData } = props;
  const format = useFormatter();

  return (
    <VerticalTimeline>
      <VerticalTimelineElement
        contentStyle={{ background: mainColor, color: '#fff' }}
        date={format.dateTime(wrappedData.startDate, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        iconStyle={{ background: mainColor, color: '#fff' }}
        icon={<FaCalendar />}
      >
        <Flex>
          <Text as="span">Our journey begins here</Text>
        </Flex>
      </VerticalTimelineElement>
      {monthlyData.map((month) => (
        <VerticalTimelineElement
          key={month.startDate}
          date={format.dateTime(month.startDate, {
            month: 'long',
          })}
          contentStyle={{ background: mainColor, color: '#fff' }}
          iconStyle={{ background: mainColor, color: '#fff' }}
          icon={<FaCalendar />}
        >
          <Flex flexFlow={'column'} alignItems={'center'}>
            <Flex gap={3}>
              <Text
                bg="blackAlpha.400"
                p={2}
                borderRadius={'md'}
                fontSize="sm"
                as="span"
                textAlign={'center'}
                display={'inline-block'}
              >
                Est. Revenue
                <br />
                <b>{format.number(month.estRevenue)} NP</b>
              </Text>
              <Text
                bg="blackAlpha.400"
                p={2}
                borderRadius={'md'}
                fontSize="sm"
                as="span"
                textAlign={'center'}
                display={'inline-block'}
              >
                Items Bought <br />
                <b>{format.number(month.totalBought.count)}</b>
              </Text>
              <Text
                bg="blackAlpha.400"
                p={2}
                borderRadius={'md'}
                fontSize="sm"
                as="span"
                textAlign={'center'}
                display={'inline-block'}
              >
                Total Lost <br />
                <b>{format.number(month.totalLost.value)} NP</b>
              </Text>
            </Flex>
            <Tabs variant="soft-rounded" colorScheme="green" align="center" mt={3}>
              <TabList>
                <Tab color={'white'}>Hottest Buys</Tab>
                <Tab color={'white'}>Worst Losses</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Flex flexWrap={'wrap'} flexFlow={'column'} gap={2}>
                    {month.hottestBought.slice(0, 5).map((bought, i) => (
                      <RestockItem
                        disablePrefetch
                        item={bought.item}
                        clickData={bought.click}
                        restockItem={bought.restockItem}
                        key={i}
                      />
                    ))}
                  </Flex>
                </TabPanel>
                <TabPanel>
                  <Flex flexWrap={'wrap'} flexFlow={'column'} gap={2} mt={2}>
                    {month.hottestLost.slice(0, 5).map((bought, i) => (
                      <RestockItem
                        disablePrefetch
                        item={bought.item}
                        clickData={bought.click}
                        restockItem={bought.restockItem}
                        key={i}
                      />
                    ))}
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Flex>
        </VerticalTimelineElement>
      ))}
      <VerticalTimelineElement
        contentStyle={{ background: mainColor, color: '#fff' }}
        date={format.dateTime(wrappedData.endDate, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        iconStyle={{ background: mainColor, color: '#fff' }}
        icon={<FaCalendar />}
      >
        <Flex>
          <Text as="span">Our journey ends here</Text>
        </Flex>
      </VerticalTimelineElement>
    </VerticalTimeline>
  );
};

export default WrappedTimeline;
