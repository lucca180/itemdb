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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { SearchStats, SearchFilters } from '../../types';
import CustomNumberInput from '../Input/CustomNumber';
import NegCheckbox from '../Input/NegCheckbox';

type Props = {
  stats?: SearchStats | null;
  filters: SearchFilters;
  isColorSearch?: boolean;
  onChange?: (newFilters: SearchFilters) => void;
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
  const { stats, isColorSearch } = props;
  const [showMoreCat, setCat] = useBoolean();
  const [filters, setFilters] = useState<SearchFilters>(props.filters);
  const [colorVal, setColorVal] = useState<string>(
    props.filters.color && !ALL_COLORS_CODE.includes(props.filters.color.toLowerCase())
      ? props.filters.color
      : '#c4bce4'
  );

  useEffect(() => {
    setFilters(props.filters);
    setColorVal(
      props.filters.color && !ALL_COLORS_CODE.includes(props.filters.color.toLowerCase())
        ? props.filters.color
        : '#c4bce4'
    );
  }, [props.filters]);

  // useEffect(() => {
  //   console.log('opa, setou', filters)
  // }, [filters])

  const handleCheckChange = (
    newFilter: string,
    filterType: keyof typeof filters,
    defaultValue: string
  ) => {
    if (
      [
        'price',
        'owlsValue',
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
      | 'owlsValue'
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

  const handleSelectChange = (newVal: string, filterType: 'colorType') => {
    setFilters({ ...filters, [filterType]: newVal });
    props.onChange?.({ ...filters, [filterType]: newVal });
  };

  return (
    <Accordion defaultIndex={[0]} allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left" fontSize="sm" color="gray.300">
              Category {filters.category.length > 0 && <Badge>{filters.category.length}</Badge>}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <VStack alignItems="flex-start">
            {stats &&
              Object.entries(stats.category)
                .sort((a, b) => b[1] - a[1])
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
                {showMoreCat ? 'Show less' : 'Show more'}
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
              Type {filters.type.length > 0 && <Badge>{filters.type.length}</Badge>}
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
            <NegCheckbox
              value="wearable"
              onChange={(val) => handleCheckChange(val, 'type', 'wearable')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="blue">Wearable</Badge>{' '}
                <Badge>{stats?.isWearable.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
            <NegCheckbox
              value="neohome"
              onChange={(val) => handleCheckChange(val, 'type', 'neohome')}
              checklist={filters.type}
            >
              <Text fontSize={'sm'}>
                <Badge colorScheme="cyan">Neohome</Badge>{' '}
                <Badge>{stats?.isNeohome?.true ?? 0}</Badge>
              </Text>
            </NegCheckbox>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              <Badge colorScheme="green">NP</Badge> Price Range{' '}
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
              to
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
              <Badge colorScheme="purple">NC</Badge> Owls Value{' '}
              {filters.owlsValue.filter((a) => a || a === '0').length > 0 && (
                <Badge>{filters.owlsValue.filter((a) => a || a === '0').length}</Badge>
              )}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <HStack>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 0, 'owlsValue')}
              value={filters.owlsValue[0]}
            />
            <Text fontSize="sm" color="gray.300">
              to
            </Text>
            <CustomNumberInput
              onChange={(val) => handleNumberChange(val, 1, 'owlsValue')}
              value={filters.owlsValue[1]}
            />
          </HStack>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" fontSize="sm" textAlign="left" color="gray.300">
              Rarity{' '}
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
              to
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
              Weight{' '}
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
              to
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
              Est. Val{' '}
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
              to
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
              Min Restock Profit {filters.restockProfit && <Badge>1</Badge>}
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
              Status {filters.status.length > 0 && <Badge>{filters.status.length}</Badge>}
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
              Color {filters.color.length > 0 && <Badge>1</Badge>}
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
                placeholder="Custom Color"
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
                Color Type
              </Text>
              <Select
                variant={'filled'}
                bg={'whiteAlpha.200'}
                size="sm"
                value={filters.colorType}
                disabled={isColorSearch}
                onChange={(e) => handleSelectChange(e.target.value, 'colorType')}
              >
                <option value="vibrant">Vibrant</option>
                <option value="darkvibrant">Dark Vibrant</option>
                <option value="lightvibrant">Light Vibrant</option>
                <option value="muted">Muted</option>
                <option value="darkmuted">Dark Muted</option>
                <option value="lightmuted">Light Muted</option>
                <option value="population">Most Prominent</option>
              </Select>
            </HStack>
            <HStack>
              <Text flex="1 0 auto" fontSize={'xs'}>
                Tolerance
              </Text>
              <CustomNumberInput
                wrapperProps={{ size: 'sm' }}
                inputProps={{ textAlign: 'left' }}
                onChange={(val) => handleNumberChange(val, 0, 'colorTolerance')}
                value={filters.colorTolerance}
              />
            </HStack>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
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
