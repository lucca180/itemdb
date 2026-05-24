import {
  Accordion,
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import CustomNumberInput from '@components/Input/CustomNumber';
import NegCheckbox from '@components/Input/NegCheckbox';
import { SearchStats, SearchFilters as SearchFiltersType } from '../../types';

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
const CUSTOM_COLOR_FALLBACK = '#c4bce4';
const RANGE_LIMIT = 5;

type ChecklistFilter = 'category' | 'type' | 'zone' | 'status';
type RangeFilter = 'price' | 'rarity' | 'weight' | 'estVal' | 'ncValue';
type ScalarNumberFilter = 'restockProfit' | 'colorTolerance';
type NumberFilter = RangeFilter | ScalarNumberFilter;
type SelectFilter = 'colorType' | 'mode';
type FacetEntry = [string, number];

const getCustomColorValue = (color: string) =>
  color && !ALL_COLORS_CODE.includes(color.toLowerCase()) ? color : CUSTOM_COLOR_FALLBACK;

const SearchFilters = (props: Props) => {
  const t = useTranslations();
  const { filters, stats, isColorSearch } = props;
  const [showMoreCat, setShowMoreCat] = useState(false);
  const [showMoreZone, setShowMoreZone] = useState(false);
  const [customColor, setCustomColor] = useState({
    filterColor: filters.color,
    value: getCustomColorValue(filters.color),
  });

  if (customColor.filterColor !== filters.color) {
    setCustomColor({
      filterColor: filters.color,
      value: getCustomColorValue(filters.color),
    });
  }

  const colorVal =
    customColor.filterColor === filters.color
      ? customColor.value
      : getCustomColorValue(filters.color);

  const updateFilters = (newFilters: SearchFiltersType) => {
    props.onChange?.(newFilters);
  };

  const handleCheckChange = (
    newFilter: string,
    filterType: ChecklistFilter,
    defaultValue: string
  ) => {
    const newFilters = filters[filterType].filter(
      (f) => f !== defaultValue && f !== `!${defaultValue}`
    );

    if (newFilter) newFilters.push(newFilter);

    updateFilters({ ...filters, [filterType]: newFilters });
  };

  const handleColorChange = (newFilter: string) => {
    updateFilters({ ...filters, color: newFilter });
  };

  const handleNumberChange = (newVal: string, index: number, filterType: NumberFilter) => {
    if (isRangeFilter(filterType)) {
      const tuple = [...filters[filterType]];
      tuple[index] = newVal;
      updateFilters({ ...filters, [filterType]: tuple });
      return;
    }

    updateFilters({ ...filters, [filterType]: newVal });
  };

  const handleSelectChange = (newVal: string, filterType: SelectFilter) => {
    updateFilters({ ...filters, [filterType]: newVal });
  };

  const categoryEntries = stats
    ? Object.entries(getCategories(stats.category, filters.category))
        .sort((a, b) => sortCategories(a[0], b[0], filters.category, !showMoreCat))
        .slice(0, showMoreCat ? undefined : RANGE_LIMIT)
    : [];

  const zoneEntries = stats
    ? Object.entries(stats.zone_label)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .filter(([name]) => name !== 'Unknown')
        .slice(0, showMoreZone ? undefined : RANGE_LIMIT)
    : [];

  const statusEntries = stats ? Object.entries(stats.status).sort((a, b) => b[1] - a[1]) : [];

  const typeGroups = [
    [
      badgeOption('np', <Badge colorPalette="green">NP</Badge>, stats?.type.np),
      badgeOption('nc', <Badge colorPalette="purple">NC</Badge>, stats?.type.nc),
      badgeOption('pb', <Badge colorPalette="yellow">PB</Badge>, stats?.type.pb),
    ],
    [
      badgeOption(
        'wearable',
        <Badge colorPalette="blue">{t('General.wearable')}</Badge>,
        stats?.isWearable.true
      ),
      badgeOption(
        'neohome',
        <Badge colorPalette="cyan">{t('General.neohome')}</Badge>,
        stats?.isNeohome?.true
      ),
      badgeOption(
        'battledome',
        <Badge colorPalette="red">{t('General.battledome')}</Badge>,
        stats?.isBD?.true
      ),
    ],
    [
      badgeOption(
        'canRead',
        <Badge colorPalette="orange">{t('General.readable')}</Badge>,
        stats?.canRead?.true
      ),
      badgeOption(
        'canEat',
        <Badge colorPalette="orange">{t('General.edible')}</Badge>,
        stats?.canEat?.true
      ),
      badgeOption(
        'canPlay',
        <Badge colorPalette="orange">{t('General.playable')}</Badge>,
        stats?.canPlay?.true
      ),
    ],
    [
      badgeOption('ets', <Badge colorPalette="green">Easy to Sell</Badge>, stats?.saleStatus?.ets),
      badgeOption(
        'regular',
        <Badge colorPalette="gray">Regular</Badge>,
        stats?.saleStatus?.regular
      ),
      badgeOption('hts', <Badge colorPalette="red">Hard To Sell</Badge>, stats?.saleStatus?.hts),
    ],
    [
      badgeOption('collectible', <Badge colorPalette="yellow">{t('General.album-item')}</Badge>),
      badgeOption(
        'p2Paintable',
        <Badge colorPalette="pink">{t('General.paintable-petpet')}</Badge>
      ),
      badgeOption(
        'p2Canonical',
        <Badge colorPalette="pink">{t('General.canonical-petpet')}</Badge>
      ),
    ],
  ];

  return (
    <Accordion.Root collapsible defaultValue={['category']}>
      <FilterSection value="category" title={t('General.category')} count={filters.category.length}>
        <FacetCheckboxList
          entries={categoryEntries}
          checklist={filters.category}
          filterType="category"
          isLoaded={!!stats}
          onChange={handleCheckChange}
        />
        <ShowMoreButton
          isVisible={!!stats && Object.keys(stats.category).length > RANGE_LIMIT}
          isExpanded={showMoreCat}
          onToggle={() => setShowMoreCat((current) => !current)}
          showLessText={t('Search.show-less')}
          showMoreText={t('Search.show-more')}
        />
      </FilterSection>

      <FilterSection value="type" title={t('General.type')} count={filters.type.length}>
        <VStack alignItems="flex-start">
          {typeGroups.map((group, groupIndex) => (
            <TypeOptionGroup
              key={groupIndex}
              options={group}
              checklist={filters.type}
              onChange={(val, option) => handleCheckChange(val, 'type', option)}
              withDivider={groupIndex > 0}
            />
          ))}
        </VStack>
      </FilterSection>

      <RangeFilterSection
        value="price"
        title={
          <>
            <Badge colorPalette="green">NP</Badge> {t('General.price-range')}
          </>
        }
        filterType="price"
        values={filters.price}
        onChange={handleNumberChange}
        toText={t('General.to')}
      />
      <RangeFilterSection
        value="ncValue"
        title="NC Value"
        filterType="ncValue"
        values={filters.ncValue}
        onChange={handleNumberChange}
        toText={t('General.to')}
      />
      <RangeFilterSection
        value="rarity"
        title={t('General.rarity')}
        filterType="rarity"
        values={filters.rarity}
        onChange={handleNumberChange}
        toText={t('General.to')}
      />
      <RangeFilterSection
        value="weight"
        title={t('General.weight')}
        filterType="weight"
        values={filters.weight}
        onChange={handleNumberChange}
        toText={t('General.to')}
      />
      <RangeFilterSection
        value="estVal"
        title={t('General.est-val')}
        filterType="estVal"
        values={filters.estVal}
        onChange={handleNumberChange}
        toText={t('General.to')}
      />

      <FilterSection
        value="restockProfit"
        title={t('Search.min-restock-profit')}
        count={filters.restockProfit ? 1 : 0}
      >
        <HStack>
          <CustomNumberInput
            onChange={(val) => handleNumberChange(val, 0, 'restockProfit')}
            value={filters.restockProfit}
            wrapperProps={{ bg: 'blackAlpha.400', borderRadius: 'md' }}
            inputProps={{ borderRadius: 'md' }}
          />
        </HStack>
      </FilterSection>

      <FilterSection value="zone" title={t('General.wearable-zone')} count={filters.zone.length}>
        <FacetCheckboxList
          entries={zoneEntries}
          checklist={filters.zone}
          filterType="zone"
          isLoaded={!!stats}
          onChange={handleCheckChange}
        />
        <ShowMoreButton
          isVisible={!!stats && Object.keys(stats.zone_label).length > RANGE_LIMIT}
          isExpanded={showMoreZone}
          onToggle={() => setShowMoreZone((current) => !current)}
          showLessText={t('Search.show-less')}
          showMoreText={t('Search.show-more')}
        />
      </FilterSection>

      <FilterSection value="status" title={t('General.status')} count={filters.status.length}>
        <FacetCheckboxList
          entries={statusEntries}
          checklist={filters.status}
          filterType="status"
          isLoaded={!!stats}
          onChange={handleCheckChange}
        />
      </FilterSection>

      <FilterSection
        value="color"
        title={t('General.color')}
        count={filters.color.length > 0 ? 1 : 0}
      >
        <VStack alignItems="flex-start">
          {ALL_COLORS.map(([hex, name]) => (
            <NegCheckbox
              disabled={isColorSearch}
              key={hex}
              value={hex}
              onChange={handleColorChange}
              checklist={[filters.color.toLowerCase()]}
            >
              <Text as="div" fontSize="sm">
                <ColorBox color={hex} /> {name}
              </Text>
            </NegCheckbox>
          ))}
          <HStack justifyContent="center">
            <NegCheckbox
              disabled={isColorSearch}
              value={colorVal}
              onChange={handleColorChange}
              checklist={[filters.color]}
            >
              <ColorBox color={colorVal} />
            </NegCheckbox>
            <Input
              placeholder={t('Search.custom-color')}
              disabled={isColorSearch}
              value={colorVal}
              size="xs"
              variant="subtle"
              bg="blackAlpha.400"
              borderRadius="md"
              onChange={(e) =>
                setCustomColor({ filterColor: filters.color, value: e.target.value })
              }
              maxLength={7}
            />
          </HStack>
          <HStack>
            <Text flex="1 0 auto" fontSize="xs">
              {t('Search.color-type')}
            </Text>
            <NativeSelect.Root
              variant="subtle"
              bg="blackAlpha.400"
              borderRadius="md"
              size="xs"
              disabled={isColorSearch}
            >
              <NativeSelect.Field
                value={filters.colorType}
                onChange={(e) => handleSelectChange(e.target.value, 'colorType')}
              >
                <option value="population">{t('Search.most-prominent')}</option>
                <option value="vibrant">Vibrant</option>
                <option value="darkvibrant">Dark Vibrant</option>
                <option value="lightvibrant">Light Vibrant</option>
                <option value="muted">Muted</option>
                <option value="darkmuted">Dark Muted</option>
                <option value="lightmuted">Light Muted</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
          <HStack>
            <Text flex="1 0 auto" fontSize="xs">
              {t('Search.tolerance')}
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'colorTolerance')}
              value={filters.colorTolerance}
              wrapperProps={{ size: 'xs', bg: 'blackAlpha.400', borderRadius: 'md' }}
              inputProps={{ textAlign: 'left', borderRadius: 'md', bg: 'transparent' }}
            />
          </HStack>
        </VStack>
      </FilterSection>

      {!props.isLists && (
        <FilterSection
          value="mode"
          title={t('General.search-mode')}
          count={filters.mode !== 'name' ? 1 : 0}
        >
          <HStack>
            <NativeSelect.Root size="sm" variant="subtle" bg="blackAlpha.400" borderRadius="md">
              <NativeSelect.Field
                value={filters.mode}
                onChange={(e) => handleSelectChange(e.target.value, 'mode')}
              >
                <option value="name">{t('General.item-name')}</option>
                <option value="description">{t('General.item-description')}</option>
                <option value="all">{t('General.item-name-and-description')}</option>
                <option value="not">{t('General.name-not-contains')}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
        </FilterSection>
      )}
    </Accordion.Root>
  );
};

export default SearchFilters;

const FilterSection = (props: {
  value: string;
  title: ReactNode;
  count?: number;
  children: ReactNode;
}) => (
  <Accordion.Item value={props.value}>
    <Accordion.ItemTrigger px={3}>
      <Box as="span" flex="1" textAlign="left" fontSize="sm" color="gray.300">
        {props.title} {!!props.count && <Badge>{props.count}</Badge>}
      </Box>
      <Accordion.ItemIndicator />
    </Accordion.ItemTrigger>
    <Accordion.ItemContent>
      <Accordion.ItemBody pb={4} px={3}>
        {props.children}
      </Accordion.ItemBody>
    </Accordion.ItemContent>
  </Accordion.Item>
);

const RangeFilterSection = (props: {
  value: string;
  title: ReactNode;
  filterType: RangeFilter;
  values: string[];
  onChange: (newVal: string, index: number, filterType: NumberFilter) => void;
  toText: string;
}) => (
  <FilterSection value={props.value} title={props.title} count={countFilledValues(props.values)}>
    <HStack>
      <CustomNumberInput
        onChange={(val) => props.onChange(val, 0, props.filterType)}
        value={props.values[0]}
        wrapperProps={{ bg: 'blackAlpha.400', borderRadius: 'md' }}
        inputProps={{ borderRadius: 'md' }}
      />
      <Text fontSize="sm" color="gray.300">
        {props.toText}
      </Text>
      <CustomNumberInput
        onChange={(val) => props.onChange(val, 1, props.filterType)}
        value={props.values[1]}
        wrapperProps={{ bg: 'blackAlpha.400', borderRadius: 'md' }}
        inputProps={{ borderRadius: 'md' }}
      />
    </HStack>
  </FilterSection>
);

const FacetCheckboxList = (props: {
  entries: FacetEntry[];
  checklist: string[];
  filterType: ChecklistFilter;
  isLoaded: boolean;
  onChange: (newFilter: string, filterType: ChecklistFilter, defaultValue: string) => void;
}) => (
  <VStack alignItems="flex-start">
    {props.isLoaded &&
      props.entries.map(([name, count]) => (
        <NegCheckbox
          key={name}
          value={name}
          onChange={(val) => props.onChange(val, props.filterType, name)}
          checklist={props.checklist}
        >
          <Text fontSize="sm" textTransform="capitalize">
            {name} <Badge>{count}</Badge>
          </Text>
        </NegCheckbox>
      ))}
    {!props.isLoaded && <FilterSkeletons />}
  </VStack>
);

type TypeOption = {
  value: string;
  label: ReactNode;
  count?: number;
};

const TypeOptionGroup = (props: {
  options: TypeOption[];
  checklist: string[];
  withDivider: boolean;
  onChange: (newFilter: string, defaultValue: string) => void;
}) => (
  <>
    {props.withDivider && <Separator />}
    {props.options.map((option) => (
      <NegCheckbox
        key={option.value}
        value={option.value}
        onChange={(val) => props.onChange(val, option.value)}
        checklist={props.checklist}
      >
        <Text fontSize="sm">
          {option.label} {typeof option.count !== 'undefined' && <Badge>{option.count ?? 0}</Badge>}
        </Text>
      </NegCheckbox>
    ))}
  </>
);

const ShowMoreButton = (props: {
  isVisible: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  showLessText: string;
  showMoreText: string;
}) => {
  if (!props.isVisible) return null;

  return (
    <Center mt={3}>
      <Button
        size="xs"
        variant={'ghost'}
        color="gray.300"
        cursor="pointer"
        onClick={props.onToggle}
        textAlign="center"
      >
        {props.isExpanded ? props.showLessText : props.showMoreText}
      </Button>
    </Center>
  );
};

const FilterSkeletons = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} w="100%" h="25px" />
    ))}
  </>
);

const ColorBox = (props: { color: string }) => (
  <Box display="inline-block" verticalAlign="middle" bg={props.color} width="15px" height="15px" />
);

const badgeOption = (value: string, label: ReactNode, count?: number): TypeOption => ({
  value,
  label,
  count,
});

const isRangeFilter = (filterType: NumberFilter): filterType is RangeFilter =>
  !['restockProfit', 'colorTolerance'].includes(filterType);

const countFilledValues = (values: string[]) =>
  values.filter((value) => value || value === '0').length;

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
  const stats = Object.keys(catStats).map((s) => s.toLowerCase());
  const nextCatStats = { ...catStats };
  const selectedStats = selected.filter(
    (s) => !stats.includes(s.toLowerCase()) && !stats.includes(`!${s.toLowerCase()}`)
  );

  selectedStats.forEach((s) => {
    const key = s.startsWith('!') ? s.slice(1) : s;
    if (!nextCatStats[key]) nextCatStats[key] = 0;
  });

  return nextCatStats;
};
