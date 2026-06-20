import { createCanvas, loadImage } from '@napi-rs/canvas';
import pixelmatch from 'pixelmatch';

// this function detects if the item image has the wearable icon
export const detectWearable = async (imageURL: string) => {
  const [wearableIcon, itemImage] = await Promise.all([
    loadImage('public/t.png'),
    loadImage(imageURL),
  ]);

  const iconCanvas = createCanvas(wearableIcon.width, wearableIcon.height);
  const iconCtx = iconCanvas.getContext('2d');
  iconCtx.drawImage(wearableIcon, 0, 0);
  // create a 17x16 canvas of the item image at the bottom left corner
  const itemCanvas = createCanvas(17, 16);
  const itemCtx = itemCanvas.getContext('2d');
  itemCtx.drawImage(itemImage, -1, -63, itemImage.width, itemImage.height);

  const iconImageData = iconCtx.getImageData(0, 0, wearableIcon.width, wearableIcon.height);
  const itemImageData = itemCtx.getImageData(0, 0, 17, 16);

  const val = pixelmatch(iconImageData.data, itemImageData.data, null as any, 17, 16, {
    threshold: 0.1,
  });

  return val <= 60;
};
