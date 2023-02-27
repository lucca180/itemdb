import {
  Stat,
  StatArrow,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
} from '@chakra-ui/react'
import React from 'react'
import { PriceData } from '../../types'
import { format } from 'date-fns'

const intl = new Intl.NumberFormat()

type Props = {
  data: PriceData[]
}

const PriceTable = (props: Props) => {
  const { data } = props
  const sortedData = data

  return (
    <TableContainer minH={200}>
      <Table h="100%" variant="striped" colorScheme="gray" size="sm">
        {/* <TableCaption>Imperial to metric conversion factors</TableCaption> */}
        {/* <Thead>
                <Tr>
                    <Th>Price</Th>
                    <Th>at</Th>
                </Tr>
                </Thead> */}
        <Tbody>
          {sortedData.map((price, index) => (
            <Tr key={price.addedAt}>
              <Td>
                {price.inflated && (
                  <Text fontWeight="bold" color="red.400">
                    Inflated!
                  </Text>
                )}
                {intl.format(price.value)} NP
              </Td>
              <Td>
                {!!sortedData[index + 1]?.value && (
                  <Stat>
                    <StatArrow
                      type={
                        price.value - sortedData[index + 1]?.value > 0
                          ? 'increase'
                          : 'decrease'
                      }
                    />
                    {intl.format(price.value - sortedData[index + 1]?.value)} NP
                  </Stat>
                )}
              </Td>
              <Td>{format(new Date(price.addedAt), 'PPP')}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default PriceTable
