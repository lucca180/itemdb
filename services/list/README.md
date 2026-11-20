# `services/list`

Internal modules of [`ListService`](../ListService.ts).

**Do not import any file from this folder outside `services/ListService.ts`.** Everything
else (API routes, server actions, components, other services) must go through `ListService`.
If you need something from here, expose it on `ListService` (e.g. a `static` re-export) and
use it from there.

This is enforced by [`test/listItemsWrite.guard.test.ts`](../../test/listItemsWrite.guard.test.ts):
any `@services/list/` import outside the allowlist fails the suite.

Allowed exceptions:

- files inside `services/list/` itself
- tests under `test/list*`

The same test also forbids direct `ListItems` writes (`prisma.listItems.create/update/delete…`
or raw `INSERT INTO ListItems`) outside `listItemsWrite.ts` and `listCount.ts`.
