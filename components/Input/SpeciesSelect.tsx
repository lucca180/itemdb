import React from 'react';
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
  AutoCompleteTag,
} from '@choc-ui/chakra-autocomplete';

type Props = {
  value?: string[];
  onChange?: (newVals: string[]) => void;
  disabled?: boolean;
  placeHolder?: string;
};

const allSpecies = [
  'Acara',
  'Aisha',
  'Blumaroo',
  'Bori',
  'Bruce',
  'Buzz',
  'Chia',
  'Chomby',
  'Cybunny',
  'Draik',
  'Elephante',
  'Eyrie',
  'Flotsam',
  'Gelert',
  'Gnorbu',
  'Grarrl',
  'Grundo',
  'Hissi',
  'Ixi',
  'Jetsam',
  'JubJub',
  'Kacheek',
  'Kau',
  'Kiko',
  'Koi',
  'Korbat',
  'Kougra',
  'Krawk',
  'Kyrii',
  'Lenny',
  'Lupe',
  'Lutari',
  'Meerca',
  'Moehog',
  'Mynci',
  'Nimmo',
  'Ogrin',
  'Peophin',
  'Poogle',
  'Pteri',
  'Quiggle',
  'Ruki',
  'Scorchio',
  'Shoyru',
  'Skeith',
  'Techo',
  'Tonu',
  'Tuskaninny',
  'Uni',
  'Usul',
  'Vandagyre',
  'Wocky',
  'Xweetok',
  'Yurble',
  'Zafara',
];

const SpeciesSelect = (props: Props) => {
  const { value: valueProps, onChange, disabled, placeHolder } = props;

  return (
    <AutoComplete
      defaultValues={valueProps}
      openOnFocus
      rollNavigation
      multiple
      onChange={(vals) => onChange?.(vals)}
    >
      <AutoCompleteInput variant="filled" placeholder={placeHolder} disabled={disabled}>
        {({ tags }) =>
          tags.map((tag, tid) => (
            <AutoCompleteTag key={tid} label={tag.label} onRemove={tag.onRemove} />
          ))
        }
      </AutoCompleteInput>
      <AutoCompleteList>
        {allSpecies.map((option, oid) => (
          <AutoCompleteItem
            key={`option-${oid}`}
            value={option}
            label={option}
            textTransform="capitalize"
            _selected={{ bg: 'whiteAlpha.50' }}
            _focus={{ bg: 'whiteAlpha.100' }}
          >
            {option}
          </AutoCompleteItem>
        ))}
      </AutoCompleteList>
    </AutoComplete>
  );
};

export default SpeciesSelect;
