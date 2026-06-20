import Color from 'color';
import { Vibrant } from 'node-vibrant/node';
import type { Items } from '@prisma/generated/client';
import type { ItemData } from '@types';

export async function getPalette(item: Items | ItemData) {
  try {
    if (!item.image || !item.image_id) return undefined;
    const palette = await Vibrant.from(item.image).quality(1).getPalette();

    const colors = [];
    let maxPop: [string, number] = ['', 0];

    for (const [key, val] of Object.entries(palette)) {
      const color = Color.rgb(val?.rgb ?? [255, 255, 255]);
      const lab = color.lab().array();
      const hsv = color.hsv().array();
      const hex = color.hex();

      const colorData = {
        image_id: item.image_id,
        image: item.image,

        lab_l: lab[0],
        lab_a: lab[1],
        lab_b: lab[2],

        hsv_h: hsv[0],
        hsv_s: hsv[1],
        hsv_v: hsv[2],

        rgb_r: val?.rgb[0] ?? 255,
        rgb_g: val?.rgb[1] ?? 255,
        rgb_b: val?.rgb[2] ?? 255,

        hex: hex,

        type: key.toLowerCase(),
        population: val?.population ?? 0,
        isMaxPopulation: false,
      };

      if (colorData.population > maxPop[1]) maxPop = [colorData.type, colorData.population];

      colors.push(colorData);
    }

    const i = colors.findIndex((x) => x.type === maxPop[0]);
    colors[i].isMaxPopulation = true;

    return colors;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
