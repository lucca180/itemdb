-- AddForeignKey
ALTER TABLE `NcMallData` ADD CONSTRAINT `NcMallData_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
