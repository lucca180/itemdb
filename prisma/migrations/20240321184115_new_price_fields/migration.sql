/*
  Warnings:

  - You are about to alter the column `price` on the `tradeitems` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(11,0)`.

*/
-- AlterTable
ALTER TABLE `itemprices` ADD COLUMN `newPrice` DECIMAL(11, 0) NULL;

-- AlterTable
ALTER TABLE `priceprocess2` ADD COLUMN `price2` DECIMAL(11, 0) NULL;

-- AlterTable
ALTER TABLE `tradeitems` MODIFY `price` DECIMAL(11, 0) NULL;
