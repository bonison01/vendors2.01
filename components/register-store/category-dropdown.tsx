'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoryDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function CategoryDropdown({ options, selected, onChange }: CategoryDropdownProps) {
  const handleCheckedChange = (category: string, checked: boolean) => {
    const newSelected = checked
      ? [...selected, category]
      : selected.filter((cat) => cat !== category);
    onChange(newSelected);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selected.length > 0 ? selected.join(', ') : 'Select categories'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={selected.includes(category)}
            onCheckedChange={(checked) => handleCheckedChange(category, checked)}
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}