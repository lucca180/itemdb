import { Checkbox } from '@chakra-ui/react'

type Props = {
  allChecked?: boolean
  checked?: any[]
  onClick?: (checkAll: boolean) => void
}

export const SelectItemsCheckbox = (props: Props) => {
  const { allChecked, checked, onClick } = props
  return (
    <Checkbox
      colorScheme={'gray'}
      isChecked={!!checked?.length}
      isIndeterminate={!!checked?.length && !allChecked}
      onChange={() => onClick?.(!allChecked)}
      fontSize={'sm'}
    >
      {checked?.length ?? 0} Items Selected
    </Checkbox>
  )
}
