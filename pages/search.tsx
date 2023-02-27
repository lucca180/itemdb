import {
  Box,
  Button,
  Flex,
  HStack,
  Select,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import ItemCard from '../components/Items/ItemCard'
import { SearchStats } from '../types'
import { useRouter } from 'next/router'
import CardBase from '../components/Card/CardBase'
import SearchFilters from '../components/Search/SearchFilters'
import axios from 'axios'
import { SearchFilters as SearchFiltersType, SearchResults } from '../types'
import Pagination from '../components/Input/Pagination'
import qs from 'qs'

const Axios = axios.create({
  baseURL: '/api/',
})

const defaultFilters: SearchFiltersType = {
  category: [],
  type: [],
  status: [],
  color: '',
  price: ['', ''],
  rarity: ['', ''],
  weight: ['', ''],
  estVal: ['', ''],
  sortBy: 'name',
  sortDir: 'asc',
  limit: 30,
  page: 1,
}

const SearchPage = () => {
  const [searchResult, setResult] = useState<SearchResults | null>(null)
  const [searchStatus, setStatus] = useState<SearchStats | null>(null)
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters)
  const [isColorSearch, setIsColorSearch] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {
    if (router.isReady) {
      const custom = parseQueryString()
      init(custom)
    }
  }, [router.isReady])

  useEffect(() => {
    if (!router.isReady) return
    setResult(null)
    setStatus(null)

    const custom = parseQueryString()
    init(custom, true)
  }, [router.query.s])

  const init = async (
    customFilters?: SearchFiltersType,
    forceStats = false
  ) => {
    const query = (router.query.s as string) ?? ''

    // if(!query) return;

    if (query.match(/^#[0-9A-Fa-f]{6}$/)) {
      setIsColorSearch(true)

      if (!searchResult) {
        setFilters({ ...filters, sortBy: 'color' })
        customFilters = {
          ...(customFilters ?? filters),
          sortBy: 'color',
        }
      }
    } else setIsColorSearch(false)

    const params = getDifference({ ...(customFilters ?? filters) })

    let paramsString = qs.stringify(params, {
      arrayFormat: 'brackets',
      encode: false,
    })
    paramsString = paramsString ? '&' + paramsString : ''

    if (filters)
      router.replace(
        router.pathname + '?s=' + encodeURIComponent(query) + paramsString
      )

    setResult(null)

    const [resSearch, resStats] = await Promise.all([
      Axios.get('search?s=' + encodeURIComponent(query), {
        params: params,
      }),

      !searchStatus || forceStats
        ? Axios.get('search/stats?s=' + encodeURIComponent(query))
        : null,
    ])

    setResult(resSearch.data)
    if (resStats) setStatus(resStats.data)
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = {
      ...filters,
      [e.target.name]: e.target.value,
      page: 1,
    }

    setFilters(newFilter)
    init(newFilter)
  }

  const handleFilterChange = (newFilter: SearchFiltersType) => {
    setFilters({
      ...filters,
      ...newFilter,
      page: 1,
    })
  }

  const resetFilters = () => {
    const newFilter = {
      ...defaultFilters,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1,
    }

    setFilters(newFilter)
    init(newFilter)
  }

  const changePage = (page: number) => {
    setFilters({ ...filters, page: page })
    init({ ...filters, page: page })
  }

  const parseQueryString = () => {
    const queryStrings = qs.parse(router.asPath, {
      ignoreQueryPrefix: true,
    })
    const queryFilters = getDifference(queryStrings, filters)

    let customFilters = filters
    if (JSON.stringify(queryFilters) !== '{}') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      customFilters = { ...filters, ...queryFilters }
    }

    setFilters(customFilters)

    return customFilters
  }

  return (
    <Layout>
      <Flex gap={8}>
        <Box width="20%">
          <CardBase title="Search Filters" noPadding>
            <SearchFilters
              onChange={handleFilterChange}
              filters={filters}
              stats={searchStatus}
              isColorSearch={isColorSearch}
            />
            <HStack justifyContent="center" my={3}>
              <Button
                variant="outline"
                onClick={resetFilters}
                colorScheme="gray"
                size="sm"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                colorScheme="green"
                size="sm"
                onClick={() => init()}
              >
                Apply Filters
              </Button>
            </HStack>
          </CardBase>
        </Box>
        <Box width="80%">
          <HStack justifyContent={'space-between'} alignItems="center">
            <Text as="div" textColor={'gray.300'} fontSize="sm">
              {searchResult && <>{searchResult?.total_results} results</>}
              {!searchResult && <Skeleton width="100px" h="15px" />}
            </Text>
            <HStack flex="0 0 auto" minW={350}>
              <Text flex="0 0 auto" textColor={'gray.300'} fontSize="sm">
                Sort By
              </Text>
              <Select
                name="sortBy"
                variant="filled"
                value={filters.sortBy}
                onChange={handleSelectChange}
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rarity">Rarity</option>
                {isColorSearch && <option value="color">Color</option>}
                <option value="weight">Weight</option>
                <option value="estVal">Est. Val</option>
                <option value="id">ID</option>
              </Select>
              <Select
                name="sortDir"
                variant="filled"
                value={filters.sortDir}
                onChange={handleSelectChange}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </HStack>
          </HStack>
          <Flex mt={4} flexWrap="wrap" gap={5}>
            {searchResult?.content.map((item) => (
              <ItemCard item={item} key={item.internal_id} />
            ))}
            {!searchResult &&
              [...Array(24)].map((_, i) => <ItemCard key={i} />)}
          </Flex>
          {searchResult && (
            <Pagination
              currentPage={searchResult.page}
              totalPages={Math.ceil(
                searchResult.total_results / searchResult.results_per_page
              )}
              setPage={changePage}
            />
          )}

          {!searchResult && <Pagination />}
        </Box>
      </Flex>
    </Layout>
  )
}

const getDifference = (a: { [id: string]: any }, b?: SearchFiltersType) => {
  if (!b) b = defaultFilters
  const keys = Object.keys(b) as (keyof SearchFiltersType)[]
  const diff = {} as {
    [key in keyof SearchFiltersType]: string | string[] | number
  }

  for (const key of keys) {
    if (a[key] && JSON.stringify(a[key]) !== JSON.stringify(b[key]))
      diff[key] = a[key]
  }

  return diff
}

export default SearchPage
