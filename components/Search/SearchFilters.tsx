/* eslint-disable react-you-might-not-need-an-effect/you-might-not-need-an-effect */
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  VStack,
  Text,
  useBoolean,
  HStack,
  Badge,
  Skeleton,
  Input,
  Select,
  Divider,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { SearchStats, SearchFilters as SearchFiltersType } from '../../types';
import CustomNumberInput from '../Input/CustomNumber';
import NegCheckbox from '../Input/NegCheckbox';
import { useTranslations } from 'next-intl';

type Props = {
  stats?: SearchStats | null;
  filters: SearchFiltersType;
  isColorSearch?: boolean;
  onChange?: (newFilters: SearchFiltersType) => void;
  isLists?: boolean;
};

const ALL_COLORS = [
  ['#ff0000', 'Red'],
  ['#ff8000', 'Orange'],
  ['#ffff00', 'Yellow'],
  ['#00ff00', 'Green'],
  ['#00ffff', 'Cyan'],
  ['#0000ff', 'Blue'],
  ['#ff00ff', 'Magenta'],
  ['#ff0080', 'Pink'],
  ['#808080', 'Gray'],
];

const ALL_COLORS_CODE = ALL_COLORS.map(([hex]) => hex);

const SearchFilters = (props: Props) => {
  const t = useTranslations();
  const { stats, isColorSearch } = props;
  const [showMoreCat, setCat] = useBoolean();
  const [showMoreZone, setZone] = useBoolean();
  const [filters, setFilters] = useState<SearchFiltersType>(props.filters);
  const [colorVal, setColorVal] = useState<string>(
    props.filters.color && !ALL_COLORS_CODE.includes(props.filters.color.toLowerCase())
      ? props.filters.color
      : '#c4bce4'
  );

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    setFilters(props.filters);
    setColorVal(
      props.filters.color && !ALL_COLORS_CODE.includes(props.filters.color.toLowerCase())
        ? props.filters.color
        : '#c4bce4'
    );
  }, [props.filters]);

  const handleCheckChange = (
    newFilter: string,
    filterType: keyof typeof filters,
    defaultValue: string
  ) => {
    if (
      [
        'price',
        'ncValue',
        'rarity',
        'weight',
        'estVal',
        'sortBy',
        'order',
        'page',
        'limit',
      ].includes(filterType)
    )
      return;

    if (filterType === 'color') {
      setFilters({ ...filters, color: newFilter });
      if (props.onChange) props.onChange({ ...filters, color: newFilter });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const newFilters = [...filters[filterType]].filter(
      (f) => f !== defaultValue && f !== `!${defaultValue}`
    );

    if (newFilter) newFilters.push(newFilter);

    setFilters({
      ...filters,
      [filterType]: newFilters,
    });

    if (props.onChange) props.onChange({ ...filters, [filterType]: newFilters });
  };

  const handleNumberChange = (
    newVal: string,
    index: number,
    filterType:
      | 'price'
      | 'rarity'
      | 'weight'
      | 'estVal'
      | 'ncValue'
      | 'restockProfit'
      | 'colorTolerance'
  ) => {
    let newFilters = filters;
    if (!['restockProfit', 'colorTolerance'].includes(filterType)) {
      const tuple = [...filters[filterType]];
      tuple[index] = newVal;
      newFilters = { ...filters, [filterType]: tuple };
    } else newFilters = { ...filters, [filterType]: newVal };

    setFilters(newFilters);
    props.onChange?.(newFilters);
  };

  const handleSelectChange = (newVal: string, filterType: 'colorType' | 'mode') => {
    setFilters({ ...filters, [filterType]: newVal });
    props.onChange?.({ ...filters, [filterType]: newVal });
  };

  return (
    <Accordion defaultIndex={[0]} allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left" fontSize="sm" color="gray.300">
              {t('General.category')}{' '}
              {filters.category.length > 0 && <Badge>{filters.category.length}</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            {stats &&
              Object.entries(getCategories(stats.category, filters.category))
                .sort((a, b) => sortCategories(a[0], b[0], filters.category, !showMoreCat))
                .slice(0, showMoreCat ? undefined : 5)
                .map((cat) => (
                  <NegCheckbox
                    key={cat[0]}
                    value={cat[0]}
                    onChange={(val) => handleCheckChange(val, 'category', cat[0])}
                    checklist={filters.category}
                  >
                    <Text fontSize={'sm'} textTransform="capitalize">
                      {cat[0]} <Badge>{cat[1]}</Badge>
                    </Text>
                  </NegCheckbox>
                ))}
            {stats && Object.keys(stats.category).length > 5 && (
              <Text
                fontSize="sm"
                color="gray.300"
                cursor="pointer"
                onClick={setCat.toggle}
                textAlign="center"
              >
                {showMoreCat ? t('Search.show-less') : t('Search.show-more')}
              </Text>
            )}

            {!stats && [...Array(5)].map((_, i) => <Skeleton key={i} w="100%" h="25px" />)}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.type')} {filters.type.length > 0 && <Badge>{filters.type.length}</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            <NegCheckbox
              value="np"
              onChange={(val) => handleCheckChange(val, 'type', 'np')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="green">NP</Badge> <Badge>{stats?.type.np ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="nc"
              onChange={(val) => handleCheckChange(val, 'type', 'nc')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="purple">NC</Badge> <Badge>{stats?.type.nc ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="pb"
              onChange={(val) => handleCheckChange(val, 'type', 'pb')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="yellow">PB</Badge> <Badge>{stats?.type.pb ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <Divider />
            <NegCheckbox
              value="wearable"
              onChange={(val) => handleCheckChange(val, 'type', 'wearable')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="blue">{t('General.wearable')}</Badge>{' '}
                <Badge>{stats?.isWearable.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="neohome"
              onChange={(val) => handleCheckChange(val, 'type', 'neohome')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="cyan">{t('General.neohome')}</Badge>{' '}
                <Badge>{stats?.isNeohome?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="battledome"
              onChange={(val) => handleCheckChange(val, 'type', 'battledome')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="red">{t('General.battledome')}</Badge>{' '}
                <Badge>{stats?.isBD?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <Divider />
            <NegCheckbox
              value="canRead"
              onChange={(val) => handleCheckChange(val, 'type', 'canRead')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="orange">{t('General.readable')}</Badge>{' '}
                <Badge>{stats?.canRead?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="canEat"
              onChange={(val) => handleCheckChange(val, 'type', 'canEat')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="orange">{t('General.edible')}</Badge>{' '}
                <Badge>{stats?.canEat?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="canPlay"
              onChange={(val) => handleCheckChange(val, 'type', 'canPlay')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="orange">{t('General.playable')}</Badge>{' '}
                <Badge>{stats?.canPlay?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <Divider />
            <NegCheckbox
              value="ets"
              onChange={(val) => handleCheckChange(val, 'type', 'ets')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="green">Easy to Sell</Badge>{' '}
                <Badge>{stats?.saleStatus?.ets ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="regular"
              onChange={(val) => handleCheckChange(val, 'type', 'regular')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="gray">Regular</Badge>{' '}
                <Badge>{stats?.saleStatus?.regular ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="hts"
              onChange={(val) => handleCheckChange(val, 'type', 'hts')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="red">Hard To Sell</Badge>{' '}
                <Badge>{stats?.saleStatus?.hts ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <Divider />
            <NegCheckbox
              value="collectible"
              onChange={(val) => handleCheckChange(val, 'type', 'collectible')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="yellow">{t('General.album-item')}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="p2Paintable"
              onChange={(val) => handleCheckChange(val, 'type', 'p2Paintable')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="pink">{t('General.paintable-petpet')}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="p2Canonical"
              onChange={(val) => handleCheckChange(val, 'type', 'p2Canonical')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="pink">{t('General.canonical-petpet')}</Badge>
              </Text>
            </NegCheckbox>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              <Badge colorScheme="green">NP</Badge> {t('General.price-range')}{' '}
              {filters.price.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.price.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'price')}
              value={filters.price[0]}
            />
            <Text fontSize="sm" color="gray.300">
              {t('General.to')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'price')}
              value={filters.price[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              NC Value
              {filters.ncValue.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.ncValue.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'ncValue')}
              value={filters.ncValue[0]}
            />
            <Text fontSize="sm" color="gray.300">
              {t('General.to')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'ncValue')}
              value={filters.ncValue[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.rarity')}{' '}
              {filters.rarity.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.rarity.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'rarity')}
              value={filters.rarity[0]}
            />
            <Text fontSize="sm" color="gray.300">
              {t('General.to')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'rarity')}
              value={filters.rarity[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.weight')}{' '}
              {filters.weight.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.weight.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'weight')}
              value={filters.weight[0]}
            />
            <Text fontSize="sm" color="gray.300">
              {t('General.to')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'weight')}
              value={filters.weight[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.est-val')}{' '}
              {filters.estVal.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.estVal.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'estVal')}
              value={filters.estVal[0]}
            />
            <Text fontSize="sm" color="gray.300">
              {t('General.to')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'estVal')}
              value={filters.estVal[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('Search.min-restock-profit')} {filters.restockProfit && <Badge>1</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'restockProfit')}
              value={filters.restockProfit}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.wearable-zone')}{' '}
              {filters.zone.length > 0 && <Badge>{filters.zone.length}</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            {stats &&
              Object.entries(stats.zone_label)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .filter((a) => a[0] !== 'Unknown')
                .slice(0, showMoreZone ? undefined : 5)
                .map((stat) => (
                  <NegCheckbox
                    key={stat[0]}
                    value={stat[0]}
                    onChange={(val) => handleCheckChange(val, 'zone', stat[0])}
                    checklist={filters.zone}
                  >
                    <Text fontSize={'sm'} textTransform="capitalize">
                      {stat[0]} <Badge>{stat[1]}</Badge>
                    </Text>
                  </NegCheckbox>
                ))}
            {stats && Object.keys(stats.category).length > 5 && (
              <Text
                fontSize="sm"
                color="gray.300"
                cursor="pointer"
                onClick={setZone.toggle}
                textAlign="center"
              >
                {showMoreZone ? t('Search.show-less') : t('Search.show-more')}
              </Text>
            )}
            {!stats && [...Array(5)].map((_, i) => <Skeleton key={i} w="100%" h="25px" />)}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.status')}{' '}
              {filters.status.length > 0 && <Badge>{filters.status.length}</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            {stats &&
              Object.entries(stats.status)
                .sort((a, b) => b[1] - a[1])
                .map((stat) => (
                  <NegCheckbox
                    key={stat[0]}
                    value={stat[0]}
                    onChange={(val) => handleCheckChange(val, 'status', stat[0])}
                    checklist={filters.status}
                  >
                    <Text fontSize={'sm'} textTransform="capitalize">
                      {stat[0]} <Badge>{stat[1]}</Badge>
                    </Text>
                  </NegCheckbox>
                ))}
            {!stats && [...Array(5)].map((_, i) => <Skeleton key={i} w="100%" h="25px" />)}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              {t('General.color')} {filters.color.length > 0 && <Badge>1</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            {ALL_COLORS.map(([hex, name]) => (
              <NegCheckbox
                disabled={isColorSearch}
                key={hex}
                value={hex}
                onChange={(val) => handleCheckChange(val, 'color', hex)}
                checklist={[filters.color.toLowerCase()]}
              >
                <Text as="div" fontSize={'sm'}>
                  <ColorBox color={hex} /> {name}
                </Text>
              </NegCheckbox>
            ))}
            <HStack justifyContent={'center'}>
              <NegCheckbox
                disabled={isColorSearch}
                value={colorVal}
                onChange={(val) => handleCheckChange(val, 'color', colorVal)}
                checklist={[filters.color]}
              >
                <ColorBox color={colorVal} />
              </NegCheckbox>
              <Input
                placeholder={t('Search.custom-color')}
                disabled={isColorSearch}
                defaultValue={colorVal}
                size="xs"
                variant="filled"
                bg="whiteAlpha.200"
                onChange={(e) => setColorVal(e.target.value)}
                maxLength={7}
              />
            </HStack>
            <HStack>
              <Text flex="1 0 auto" fontSize={'xs'}>
                {t('Search.color-type')}
              </Text>
              <Select
                variant={'filled'}
                bg={'whiteAlpha.200'}
                size="xs"
                value={filters.colorType}
                disabled={isColorSearch}
                onChange={(e) => handleSelectChange(e.target.value, 'colorType')}
              >
                <option value="population">{t('Search.most-prominent')}</option>
                <option value="vibrant">Vibrant</option>
                <option value="darkvibrant">Dark Vibrant</option>
                <option value="lightvibrant">Light Vibrant</option>
                <option value="muted">Muted</option>
                <option value="darkmuted">Dark Muted</option>
                <option value="lightmuted">Light Muted</option>
              </Select>
            </HStack>
            <HStack>
              <Text flex="1 0 auto" fontSize={'xs'}>
                {t('Search.tolerance')}
              </Text>
              <CustomNumberInput
                wrapperProps={{ size: 'xs' }}
                inputProps={{ textAlign: 'left' }}
                onChange={(val) => handleNumberChange(val, 0, 'colorTolerance')}
                value={filters.colorTolerance}
              />
            </HStack>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      {!props.isLists && (
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
                {t('General.search-mode')} {filters.mode !== 'name' && <Badge>1</Badge>}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <HStack>
              <Select
                size="sm"
                variant={'filled'}
                bg={'whiteAlpha.200'}
                value={filters.mode}
                onChange={(e) => handleSelectChange(e.target.value, 'mode')}
              >
                <option value="name">{t('General.item-name')}</option>
                <option value="description">{t('General.item-description')}</option>
                <option value="all">{t('General.item-name-and-description')}</option>
                <option value="not">{t('General.name-not-contains')}</option>
              </Select>
            </HStack>
          </AccordionPanel>
        </AccordionItem>
      )}
    </Accordion>
  );
};

export default SearchFilters;

const ColorBox = (props: { color: string }) => (
  <Box
    display="inline-block"
    verticalAlign="middle"
    bg={props.color}
    width="15px"
    height="15px"
  ></Box>
);

const sortCategories = (a: string, b: string, selected: string[], selectedFirst = false) => {
  selected = selected.map((s) => s.toLowerCase());
  if (selectedFirst) {
    const includesA =
      selected.includes(a.toLowerCase()) || selected.includes(`!${a.toLowerCase()}`);
    const includesB =
      selected.includes(b.toLowerCase()) || selected.includes(`!${b.toLowerCase()}`);

    if (includesA && !includesB) return -1;
    if (!includesA && includesB) return 1;
    if (includesA && includesB) return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  return a.localeCompare(b);
};

const getCategories = (catStats: Record<string, number>, selected: string[]) => {
  //check if there is a selected category that is not in the stats
  const stats = Object.keys(catStats).map((s) => s.toLowerCase());
  const selectedStats = selected.filter(
    (s) => !stats.includes(s.toLowerCase()) && !stats.includes(`!${s.toLowerCase()}`)
  );

  // if there is, add it to the stats
  selectedStats.forEach((s) => {
    const key = s.startsWith('!') ? s.slice(1) : s;
    if (!catStats[key]) catStats[key] = 0;
  });

  return catStats;
};
