-- delete duplicates
delete a from itemprices a, itemprices b where a.item_iid = b.item_iid and a.addedAt = b.addedAt and a.internal_id < b.internal_id;

-- reset isLatest

update itemprices set isLatest = null where isLatest is not null;

-- update isLatest
update itemprices set isLatest = 1 where internal_id in (
select internal_id from (select internal_id
  FROM ItemPrices
  WHERE (item_iid, addedAt) IN (
      SELECT item_iid, MAX(addedAt)
      FROM ItemPrices
      where manual_check is null
      GROUP BY item_iid
  )) as c);