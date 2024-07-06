import { NextApiRequest, NextApiResponse } from 'next';
import { SearchFilters } from '../../../types';
import { doSearch } from '../v1/search';
import { allNeopetsColors, allSpecies, getPetColorId, getSpeciesId } from '../../../utils/utils';
import prisma from '../../../utils/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const createMany: Prisma.ColorSpeciesCreateManyInput[] = [];

  fs.createReadStream('./DTI_COLORS.csv')
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', function (row) {
      console.log(row);

      createMany.push({
        color_id: Number(row[1]),
        species_id: Number(row[2]),
      });
    })
    .on('end', async function () {
      console.log(createMany);

      const x = await prisma.colorSpecies.createMany({
        data: createMany,
        skipDuplicates: true,
      });

      res.status(200).json(x);
    });

  // const defaultFilters: SearchFilters = {
  //   category: [],
  //   zone: [],
  //   type: ['np'],
  //   status: [],
  //   color: '',
  //   price: ['', ''],
  //   rarity: ['', ''],
  //   weight: ['', ''],
  //   estVal: ['', ''],
  //   owlsValue: ['', ''],
  //   restockProfit: '',
  //   colorTolerance: '750',
  //   colorType: 'vibrant',
  //   sortBy: 'name',
  //   sortDir: 'asc',
  //   mode: 'name',
  //   limit: 1000,
  //   page: 1,
  // };

  // const searchResult = await doSearch("magical chia pop", defaultFilters);
  // const allItems = searchResult.content;

  // const allColors = Object.values(allNeopetsColors);
  // const allSpeciesArr = Object.values(allSpecies);
  // const createArr = [];

  // for(const item of allItems) {
  //   const name = item.name.replaceAll("pop", "").replaceAll("magical", "").trim();
  //   const color = allColors.find(color => name.toLowerCase().includes(color.toLowerCase()) || color.toLowerCase().includes(name.toLowerCase()));
  //   const species = allSpeciesArr.find(species => name.includes(species) || species.includes(name));

  //   // if(item.internal_id === 61627) color = 'Elderlyboy';

  //   if(!color || !species){
  //     console.log(name);
  //     continue;
  //   }

  //   const create: Prisma.ItemEffectCreateManyInput = {
  //     item_iid: item.internal_id,
  //     type: "colorSpecies",
  //     name: "color/species",
  //     colorTarget: getPetColorId(color),
  //     speciesTarget: getSpeciesId(species),
  //   }

  //   createArr.push(create);
  // }
  // // return res.status(200).json(createArr);

  // const x = await prisma.itemEffect.createMany({
  //   data: createArr,
  //   skipDuplicates: true,
  // });

  // return res.status(200).json(x);
  // const defaultFilters: SearchFilters = {
  //   category: [],
  //   zone: [],
  //   type: ['np'],
  //   status: [],
  //   color: '',
  //   price: ['', ''],
  //   rarity: ['', ''],
  //   weight: ['', ''],
  //   estVal: ['', ''],
  //   owlsValue: ['', ''],
  //   restockProfit: '',
  //   colorTolerance: '750',
  //   colorType: 'vibrant',
  //   sortBy: 'name',
  //   sortDir: 'asc',
  //   mode: 'name',
  //   limit: 1000,
  //   page: 1,
  // };

  // const searchResult = await doSearch("paint brush -petpet", defaultFilters);
  // const allItems = searchResult.content;

  // const allColors = Object.values(allNeopetsColors);

  // const createArr = [];

  // for(const item of allItems) {
  //   const name = item.name.replaceAll(" Paint Brush", "").trim();
  //   let color = allColors.find(color => name.includes(color) || color.includes(name));

  //   if(item.internal_id === 61627) color = 'Elderlyboy';

  //   if(!color){
  //     console.log(name);
  //     continue;
  //   }

  //   const create: Prisma.ItemEffectCreateManyInput = {
  //     item_iid: item.internal_id,
  //     type: "colorSpecies",
  //     name: "color",
  //     colorTarget: getPetColorId(color),
  //   }

  //   createArr.push(create);
  // }

  // const x = await prisma.itemEffect.createMany({
  //   data: createArr,
  //   skipDuplicates: true,
  // });
}
