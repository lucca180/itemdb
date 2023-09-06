-- CreateIndex
CREATE INDEX `ItemColor_lab_l_lab_a_lab_b_idx` ON `ItemColor`(`lab_l`, `lab_a`, `lab_b`);

-- CreateIndex
CREATE INDEX `ItemColor_image_id_lab_l_lab_a_lab_b_idx` ON `ItemColor`(`image_id`, `lab_l`, `lab_a`, `lab_b`);

-- CreateIndex
CREATE INDEX `OwlsPrice_item_iid_idx` ON `OwlsPrice`(`item_iid`);
