-- This is an empty migration.-- This is an empty migration.-- delete duplicates
 delete a from OwlsPrice a, OwlsPrice b where a.item_iid = b.item_iid and (a.addedAt = b.addedAt OR a.pricedAt = b.pricedAt) and a.internal_id < b.internal_id;

-- reset isLatest

update OwlsPrice set isLatest = null where isLatest is not null;

-- update isLatest
update OwlsPrice set isLatest = 1 where internal_id in (
select internal_id from (select internal_id
  FROM OwlsPrice
  WHERE (item_iid, addedAt) IN (
      SELECT item_iid, MAX(addedAt)
      FROM OwlsPrice
      GROUP BY item_iid
  )) as c);