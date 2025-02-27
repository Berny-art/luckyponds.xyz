'use client';

import type React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import traitStatistics from '../data/trait_statistics.json';
import { useSortStore } from '@/store/sortStore';

interface TraitValue {
  value: string;
  count: number;
  rarity_percent: number;
}

interface TraitStatistics {
  [traitType: string]: TraitValue[];
}

const TraitAccordion: React.FC = () => {
  const { traitFilters, setTraitFilter } = useSortStore();

  const handleCheckboxChange = (traitType: string, traitValue: string) => {
    setTraitFilter(traitType, traitValue);
  };

  return (
    <Accordion type="single" className="w-full flex flex-col gap-4">
      {Object.entries(traitStatistics as TraitStatistics).map(([traitType, values]) => (
        <AccordionItem key={traitType} value={traitType} className='border-2 border-primary-200 rounded px-4 text-primary-200 font-bold'>
          <AccordionTrigger className='font-bold uppercase'>{traitType}</AccordionTrigger>
          <AccordionContent className='max-h-[260px] overflow-y-auto scrollbar-custom'>
            {values.map(({ value, count, rarity_percent }) => (
              <div key={value} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={traitFilters[traitType]?.includes(value) || false}
                    onCheckedChange={() => handleCheckboxChange(traitType, value)}
                    className="h-5 w-5 border-4 border-primary-200 data-[state=checked]:bg-secondary-950 bg-primary-200 [&>span>svg]:hidden"
                  />
                  <span>{value}</span>
                </div>
                <span className="flex flex-col items-end justify-end text-xs text-muted-foreground">
                  <span className='text-primary-200/50'>{count}</span>
                  <span className='text-drip-300'>{rarity_percent}%</span>
                </span>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default TraitAccordion;
