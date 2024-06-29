/*
  Warnings:

  - You are about to drop the column `newPrice` on the `itemprices` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `itemprices` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(11,0)`.

*/

UPDATE `itemprices` SET `newPrice` = CAST(`price` AS DECIMAL(11,0));
ALTER TABLE `itemprices` DROP COLUMN `price`, RENAME COLUMN `newPrice` to `price`;

ALTER TABLE `itemprices` MODIFY `price` DECIMAL(11,0) NOT NULL;