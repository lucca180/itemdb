import Color from "color";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../utils/prisma";

const colorsPalletes = ['Vibrant', 'DarkVibrant', 'LightVibrant', 'Muted', 'DarkMuted', 'LightMuted'];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const invisibleItems = (await prisma.$queryRaw`
    select name, image, image_id from Items 
    where image_id not in (
    select image_id from ItemColor)
    and image_id is not null
  `) as {
    name: string;
    image: string;
    image_id: string;
  }[] | null;
  
  if (!invisibleItems) return res.status(500).json({ error: 'Error while fetching data' });

  const itemColorAddList = []

  for(const item of invisibleItems) {
    for(const type of colorsPalletes) {
      const color = Color.rgb([255,255,255]);
      const lab = color.lab().array();
      const hsv = color.hsv().array();
      const hex = color.hex();

      const colorPallete = {
        image_id: item.image_id,
        image: item.image,

        lab_l: lab[0],
        lab_a: lab[1],
        lab_b: lab[2],

        hsv_h: hsv[0],
        hsv_s: hsv[1],
        hsv_v: hsv[2],

        rgb_r: 255,
        rgb_g: 255,
        rgb_b: 255,

        hex: hex,

        type: type.toLowerCase(),
        population: 0,
      };

      itemColorAddList.push(colorPallete);
    }
  }

  const result = await prisma.itemColor.createMany({
    data: itemColorAddList,
    skipDuplicates: true,
  });

  return res.json(result);
}