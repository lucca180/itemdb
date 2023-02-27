import { ChevronDownIcon } from '@chakra-ui/icons'
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
} from '@chakra-ui/react'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { UserList } from '../../types'
import { useAuth } from '../../utils/auth'

type Props = {
  onChange?: (list: UserList) => void
  defaultValue?: UserList
}

const ListSelect = (props: Props) => {
  const { user, getIdToken, authLoading } = useAuth()
  const [lists, setLists] = useState<UserList[]>([])
  const [selectedList, setSelected] = useState<UserList | undefined>(
    props.defaultValue
  )

  const seeking = lists
    .filter((list) => list.purpose === 'seeking')
    .sort((a, b) => SortListByChange(a, b))
  const trading = lists
    .filter((list) => list.purpose === 'trading')
    .sort((a, b) => SortListByChange(a, b))
  const none = lists
    .filter((list) => list.purpose === 'none')
    .sort((a, b) => SortListByChange(a, b))

  useEffect(() => {
    if (!authLoading && user) {
      init()
    }
  }, [authLoading, user])

  const init = async () => {
    if (!user) return
    try {
      const token = await getIdToken()

      const res = await axios.get(
        `/api/lists/getUserLists?username=${user.username}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )

      setLists(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const handleSelect = (list: UserList) => {
    setSelected(list)
    if (props.onChange) props.onChange(list)
  }

  return (
    <Menu>
      <MenuButton as={Button} variant="solid" rightIcon={<ChevronDownIcon />}>
        {selectedList?.name ?? 'Select List'}
      </MenuButton>
      <MenuList maxH="50vh" overflow="auto">
        {seeking.length !== 0 && (
          <>
            <MenuGroup title="Seeking" />
            {seeking.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => handleSelect(list)}
              >
                {list.name}
              </MenuItem>
            ))}
            <MenuDivider />
          </>
        )}

        {trading.length !== 0 && (
          <>
            <MenuGroup title="Trading" />
            {trading.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => handleSelect(list)}
              >
                {list.name}
              </MenuItem>
            ))}
            <MenuDivider />
          </>
        )}

        {none.length !== 0 && (
          <>
            {none.map((list) => (
              <MenuItem
                key={list.internal_id}
                onClick={() => handleSelect(list)}
              >
                {list.name}
              </MenuItem>
            ))}
          </>
        )}

        {user && !authLoading && lists.length === 0 && (
          <MenuItem justifyContent="center" disabled>
            No lists found
          </MenuItem>
        )}

        {authLoading && (
          <MenuItem justifyContent="center" disabled>
            Loading....
          </MenuItem>
        )}
        {!user && !authLoading && (
          <MenuItem justifyContent="center" disabled>
            Login to use lists
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  )
}

export default ListSelect

function SortListByChange(a: UserList, b: UserList) {
  const dateA = new Date(a.updatedAt)
  const dateB = new Date(b.updatedAt)

  return dateB.getTime() - dateA.getTime()
}
