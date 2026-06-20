import React, { useEffect } from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  Item,
} from '@choc-ui/chakra-autocomplete';
import axios from 'axios';
import { Badge, Box, Flex, Image, Text, Tooltip } from '@chakra-ui/react';
import DynamicIcon from '@assets/icons/dynamic.png';
import { UserList } from '@types';
import NextImage from 'next/image';

export type ListInputSource = 'officialLists' | 'userLists';

export type ListInputOption = {
  list: UserList;
  source: ListInputSource;
};

type Props = {
  color?: string;
  isDisabled?: boolean;
  placeholder?: string;
  onChange?: (option: ListInputOption) => void;
  limit?: number;
  includeOfficialLists?: boolean;
  includeUserLists?: boolean;
};

type OmniListResponse = {
  officialLists?: UserList[];
  userLists?: UserList[];
};

const ListInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    color,
    includeOfficialLists = true,
    includeUserLists = true,
    limit = 5,
    onChange,
  } = props;
  const [query, setQuery] = React.useState('');
  const [lists, setLists] = React.useState<ListInputOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadLists = async () => {
    const only: ListInputSource[] = [];
    if (includeOfficialLists) only.push('officialLists');
    if (includeUserLists) only.push('userLists');

    const res = await axios.get<OmniListResponse>('/api/v1/search/omni', {
      params: {
        only,
        limit,
        s: query,
      },
    });

    const officialLists =
      res.data.officialLists?.map((list) => ({ list, source: 'officialLists' as const })) ?? [];
    const userLists =
      res.data.userLists?.map((list) => ({ list, source: 'userLists' as const })) ?? [];

    setLists([...officialLists, ...userLists]);
    setIsLoading(false);
  };

  const onSelectOption = ({ item }: { item: Item }) => {
    onChange?.((item.originalValue ?? item.value) as ListInputOption);
    setQuery('');
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value) {
      setLists([]);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  };

  useEffect(() => {
    if (!query) return;

    const timer = setTimeout(() => loadLists(), 300);

    return () => clearTimeout(timer);
  }, [query, includeOfficialLists, includeUserLists, limit]);

  return (
    <AutoComplete
      rollNavigation
      onSelectOption={onSelectOption}
      isLoading={isLoading}
      disableFilter
    >
      <AutoCompleteInput
        ref={ref}
        placeholder={props.placeholder ?? 'Add List'}
        disabled={props.isDisabled}
        variant="subtle"
        value={query}
        onChange={onInputChange}
        color={color}
        bg="whiteAlpha.50"
        _hover={{ bg: 'whiteAlpha.100' }}
      />
      <AutoCompleteList boxShadow="lg">
        {lists.map((option) => (
          <AutoCompleteItem
            key={`list-option-${option.source}-${option.list.internal_id}`}
            value={option}
            getValue={(value) => `${value.source}-${value.list.internal_id}`}
            label={option.list.name}
          >
            <ListOption option={option} />
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  );
});

ListInput.displayName = 'ListInput';

export default ListInput;

function ListOption({ option }: { option: ListInputOption }) {
  const { list } = option;

  return (
    <Flex alignItems="center" gap={3} minW={0}>
      <Box
        boxSize="30px"
        borderRadius="md"
        overflow="hidden"
        bg={list.colorHex ?? 'whiteAlpha.100'}
        flexShrink={0}
      >
        {list.coverURL && (
          <Image src={list.coverURL} alt={list.name} boxSize="30px" objectFit="cover" />
        )}
      </Box>
      <Flex flexFlow="column" alignItems="flex-start" minW={0} textAlign="left">
        <Flex alignItems="center" gap={2} minW={0}>
          <Text fontSize={{ base: 'sm', md: 'md' }} truncate>
            {list.name}
          </Text>
          <ListBadges list={list} />
        </Flex>
      </Flex>
    </Flex>
  );
}

function ListBadges({ list }: { list: UserList }) {
  return (
    <Flex alignItems="center" gap={1} flexShrink={0}>
      {list.purpose !== 'none' && !list.official && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge>{list.purpose === 'seeking' ? 's' : 't'}</Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content fontSize="sm">{list.purpose}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
      {list.official && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge colorPalette="blue">{'\u2713'}</Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content fontSize="sm">official</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
      {list.dynamicType && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge colorPalette="orange" display="inline-flex" alignItems="center" p="2px">
              <NextImage
                src={DynamicIcon}
                alt="lightning bolt"
                width={8}
                style={{ display: 'inline' }}
              />
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content fontSize="sm">{list.dynamicType} Dynamic List</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}
    </Flex>
  );
}
