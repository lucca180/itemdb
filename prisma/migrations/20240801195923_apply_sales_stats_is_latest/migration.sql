-- This is an empty migration.-- delete duplicates
delete a from saleStats a, saleStats b where a.item_iid = b.item_iid and a.addedAt = b.addedAt and a.internal_id < b.internal_id;

-- reset isLatest

update saleStats set isLatest = null where isLatest is not null;

-- update isLatest
update saleStats set isLatest = 1 where internal_id in (
select internal_id from (select internal_id
  FROM saleStats
  WHERE (item_iid, addedAt) IN (
      SELECT item_iid, MAX(addedAt)
      FROM saleStats
      GROUP BY item_iid
  )) as c);