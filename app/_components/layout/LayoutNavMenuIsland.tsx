'use client';

import { DropdownButton, DropdownOption } from '@components/Menus/HeaderDropdown';
import type { LayoutNavSection } from '@components/Layout/layoutData';

type LayoutNavMenuIslandProps = {
  mainColor?: string;
  sections: LayoutNavSection[];
};

export function LayoutNavMenuIsland({ mainColor, sections }: LayoutNavMenuIslandProps) {
  return (
    <>
      {sections.map((section) => (
        <DropdownButton
          key={section.href}
          bg={section.options?.length ? mainColor : undefined}
          label={section.label}
          href={section.href}
        >
          {section.options?.map((option, index) => (
            <DropdownOption
              key={`${section.href}-${option.href}-${index}`}
              label={option.label}
              href={option.href}
              newUntil={option.newUntil}
            />
          ))}
        </DropdownButton>
      ))}
    </>
  );
}
