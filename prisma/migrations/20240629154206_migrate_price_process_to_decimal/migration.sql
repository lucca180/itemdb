/*
  Warnings:

  - You are about to drop the column `price2` on the `priceprocess2` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `priceprocess2` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(11,0)`.

*/
-- AlterTable
UPDATE `priceprocess2` SET `price2` = CAST(`price` AS DECIMAL(11,0));

ALTER TABLE `priceprocess2` DROP COLUMN `price`, RENAME COLUMN `price2` to `price`;

ALTER TABLE `priceprocess2` MODIFY `price` DECIMAL(11,0) NOT NULL;