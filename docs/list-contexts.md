# List Contexts

List contexts are shared notes attached to some items of a list: a short badge,
an optional markdown title and details, and a color. They explain why an item is
special inside that list (e.g. "Bonus 3" or "Completion prize") when the single
`highlight` slot is not enough.

- A context belongs to **one list** and can include **many of its items**.
- An item can be in **many contexts** of the same list.
- Contexts are independent of `highlight`, which is unchanged.
- **For now, only official lists show contexts.** The API still accepts contexts on
  other lists (owners can write them), but their pages neither load nor show them.

---

## Data model

| Model | Columns | Notes |
| --- | --- | --- |
| `ListContext` | `list_id`, `badgeText`, `title?`, `description?`, `color`, `order`, `mode`, `createdAt`, `updatedAt` | Deleted with the list (cascade) |
| `ListContextItem` | `context_id`, `listItem_id` | Unique per pair; deleted with the context **or the list item** (cascade) |

The link points to the `ListItems` row, not to the item. An item removed from the
list leaves its contexts automatically.

The API and the `ListContext` type (`types/types.d.ts`) speak **item ids**
(`Items.internal_id`) in `itemIids`. The service resolves them to `ListItems` rows.

### Mode

`ListContext.mode` (enum `ListContextMode`, default `both`) decides where a context
shows:

| Mode | Item card corner (and its popover) | Own group in "group by context" | Contexts modal and item page footer |
| --- | --- | --- | --- |
| `both` | Yes | Yes | Yes |
| `grouping` | No | Yes | Yes |
| `badge` | Yes | No | Yes |

The rules are `contextShowsBadge` and `contextGroupsItems` in
`utils/list/listContexts.ts`. The corner color is the first context that shows a
badge. An item whose only contexts are `badge` lands in "Other items" when grouped.
The "group by context" switch only appears when at least one context groups.

### Limits (`utils/list/listContexts.ts`)

| Field | Rule |
| --- | --- |
| `badgeText` | Required, trimmed, at most `MAX_LIST_CONTEXT_BADGE_LENGTH` (40). It is shown on item cards and footers, so it is kept short. |
| `title` | Optional markdown, at most 191 characters. An empty string is stored as `null`. |
| `description` | Optional markdown (`Text`). `MAX_LIST_CONTEXT_DESCRIPTION_LENGTH` (2000) is enforced only by the editor UI. |
| `color` | Hex `#rgb`, `#rrggbb` or `#rrggbbaa` (`LIST_CONTEXT_COLOR_PATTERN`). |
| `mode` | One of `LIST_CONTEXT_MODES` (`both`, `grouping`, `badge`). Missing or `null` means `both`. |
| Contexts per list | At most `MAX_LIST_CONTEXTS` (100). |
| `itemIids` | Positive integers, deduplicated. Each one must already be in the list. |

---

## Service

The logic is in `services/list/listContexts.ts`. Like every `services/list/*`
module, it is internal: import it through `@services/ListService`. This is
enforced by `test/listItemsWrite.guard.test.ts`.

| Function | Use |
| --- | --- |
| `getListContexts(listId, includeHidden)` | Every context of a list, in the list's order. |
| `getItemListContexts(itemIid, listIds)` | Contexts that include one item, keyed by list id. Used by the item page. |
| `createListContext` / `updateListContext` / `deleteListContext` | Mutations. Each returns `{ context, affectedItemIids }`. |
| `reorderListContexts(listId, contextIds)` | Sets `order` for every context. Returns `{ contexts, affectedItemIids }`. |
| `listService.getListContextsFor(list)` | `getListContexts` with `includeHidden` set from the viewer (owner or admin). |

- **Order matters.** Contexts are sorted by `order`, then `internal_id` (rows created
  before `order` existed all have 0). The first context of an item decides the
  corner color and the footer badge. Groups follow the same order.
- **New contexts go last** (`order` = current max + 1).
- **Reorder** needs every context of the list exactly once in `contextIds`. A missing,
  repeated or foreign id fails with a 400, so a stale editor can't drop positions.
  `affectedItemIids` is every item in any context, because an item's first
  context may have changed.
- **Hidden items.** Links to hidden list items are dropped from `itemIids` unless
  `includeHidden` is set. `getItemListContexts` always drops them.
- **Item replace semantics.** `itemIids` on update **replaces** the context's items.
  When `itemIids` is omitted, the items are left untouched.
- **Unknown items.** An item that is not in the list fails the whole request with
  a 400 that names the missing ids.
- **`affectedItemIids`** covers the items before and after the change. It is used
  for cache revalidation.

Errors are `ListContextError` with status 400 (validation) or 404 (context not in
this list).

---

## API

| Method | Route | Body / result |
| --- | --- | --- |
| `GET` | `/api/v1/lists/[username]/[list_id]/contexts` | `ListContext[]`. `username` can be `official`, and `list_id` can be an id or a slug. |
| `POST` | `/api/v1/lists/[username]/[list_id]/contexts` | `ListContextCreateRequest` → the created context |
| `PATCH` | `/api/v1/lists/[username]/[list_id]/contexts` | `{ contextIds: number[] }` in the new order → every context (with hidden items) |
| `PATCH` | `/api/v1/lists/[username]/[list_id]/contexts/[context_id]` | `ListContextUpdateRequest` (partial) → the updated context |
| `DELETE` | `/api/v1/lists/[username]/[list_id]/contexts/[context_id]` | `{ success: true }` |

### Permissions

Write routes use `canEditListInfo`, the same rule as the highlight:

- Official lists: admins only.
- Other lists: the owner only.
- Logged out or banned → 401. Not allowed → 403. Unknown list → 404.

Write routes need the numeric `list_id`. The `username` segment is not checked.

### GET caching

- Logged-in viewers get `private, no-store`, because owners and admins also
  receive hidden items.
- Logged-out viewers get `s-maxage=600` on official lists and `s-maxage=180` on
  other lists.

### After a mutation (`afterContextMutation`)

1. On official lists, the change is logged with `logOfficialListAction`:
   `createContext`, `updateContext` or `deleteContext` (context id, badge and item
   ids), or `reorderContexts` (context ids in the new order).
2. `revalidateListCaches(list_id)` invalidates the list-items tags (preload, full
   and full-owner), and those tags also cover the list page contexts.
3. On official lists, the `lists` section tag of every affected item is
   revalidated, so the item page footer updates.

---

## Loading and caching

| Page | Loader | Cache |
| --- | --- | --- |
| List page | `getListContexts(core)` in `loadListPage.ts` | `'use cache'`, tag `full` or `full-owner` of the list, `cacheLife('homeSection')` |
| Item page | `loadItemListContexts(iid, listIds)` in `app/_components/Item/loadUtils.ts` | `'use cache'`, the item's `lists` section tag, `cacheLife('itemSection')` |

The list page uses the `full-owner` tag when the viewer can see hidden items, so
an owner's entry is never served to other viewers. It skips the query for lists
that are not official. The item page only loads contexts when the item has
official lists.

---

## UI

### List page (`ListPageClient.tsx`)

- `ListContextsProvider` wraps the page. Cards read their contexts with
  `useItemListContexts(iid)`, and `EditableItemCard` passes them to the
  `ItemCardV2` `corner` slot.
- A row above the items holds:
  - **"Contexts (N)"**, which opens `ListContextsModal` with every context and
    its items. This button appears when the list has contexts.
  - **"Manage contexts"**, which opens `ListContextsEditorModal`. This button
    appears on official lists for viewers who pass `canEditListInfo` (admins).
  - **"Group by context"**, a switch hidden in edit mode. It starts from the list's
    `UserList.groupByContext` (default `false`), which is set by "Group by context
    by default?" in the edit list modal (official lists only). A visitor's switch
    is not saved.
- After a save, the editor updates the page state directly, without a reload.

### Item card corner (`ListContextCorner`)

The corner is a 30px folded triangle in the top-right corner of the card, in the
**first** context's color. It shows ⓘ when the item has one context, and one dot
per context (up to 3) when it has more. The icon color is picked for contrast
(`contextTextColor`).

`ItemCardV2` renders `corner` outside the item link, so the corner can be its own
button. The wrapper keeps `h="100%"`, so cards with a corner stretch like the cards
around them.

### Details popover (`ListContextPopover`)

The popover lists every context of the item: badge, title, markdown details
(lists allowed) and how many items share each context.

- On desktop, hovering opens it. A click (or a tap on mobile) pins it open.
- On the list page it also has "see all", which opens the contexts modal focused
  on that context.

### Group by context (`ListContextGroups`)

- One block per context that has visible items, with a top border in the
  context's color and a badge header that opens the popover.
- An item with several contexts appears in **each** of its groups. Inside a group,
  its corner leaves out that group's own context (`ListContextGroupProvider`).
- Groups with up to 6 items (`SMALL_GROUP_MAX`) render cards directly and can sit
  side by side. Larger groups take the full width and use `ItemList`.
- Items in no context come last under "Other items".
- Hidden items follow the page's "only hidden" filter.

### Editor (`ListContextsEditorModal`)

The editor is styled like `/admin/price-markers`. It has three columns: the
context list, the form (with a live card preview), and the item picker.

- **Pick tab:** search by name and toggle items. Each item shows the other
  contexts it already has.
- **Paste tab:** one entry per line or comma-separated, matched against list items
  by `Items.internal_id` or by exact name (case-insensitive). Entries that don't
  match are listed back.
- **Order:** drag a context by its handle (`@dnd-kit`, mouse, touch or keyboard).
  The new order is saved right away with the `PATCH` route, and the change is
  undone if the request fails.
- Delete asks for a second click to confirm.

### Item page (`ItemOfficialList.tsx`)

Each official list card that has contexts for the item shows a **footer** in the
**list's** color (mixed 60% with black), not the context color. The footer shows
the first badge, "+N" for the others, and ⓘ, and it opens the same popover
without "see all".

---

## Tests

`test/listContexts.test.ts` covers:

- permissions;
- validation;
- item resolution;
- replace semantics;
- order on create and reorder validation;
- mode validation and partial updates;
- revalidation tags;
- hidden filtering.
