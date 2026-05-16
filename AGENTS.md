
## General guidelines

- Always refer to the official documentation for any framework or library you are using. This ensures that you are following best practices and using the most up-to-date information.

- When making changes to the codebase, ensure that you understand the existing code and how your changes will fit into it. This will help prevent introducing bugs or breaking existing functionality.

- Avoid running global commands such as `prettier`. Instead, use more contained commands that target specific files or directories. This helps prevent unintended changes to files that you did not intend to modify.

- Avoid running `yarn build` unless you are sure that your changes require it. Building the project can be time-consuming, and it is often not necessary for small changes.

- Avoid changing project configs such as `tsconfig.json`, `eslint.config.js`, `next.config.ts`. ALWAYS confirm with user before making changes to these files, as they can have wide-reaching effects on the project and may require additional adjustments to work properly.

- NEVER change the `package.json` file without confirming with user first. This file contains important information about the project, including dependencies and scripts, and changes to it can have significant consequences.

- NEVER EVER add, remove or update dependencies without confirming with user first.

- When checking for Chakra UI docs, always refer to the official Chakra UI documentation at https://v2.chakra-ui.com/docs/getting-started. Make sure you're looking at the correct version of the documentation that matches the version of Chakra UI being used in the project (v2 in this case).

- ALWAYS use import aliases (e.g., `@utils`, `@components`) instead of relative paths (e.g., `../../utils`, `../components`). This improves readability and maintainability of the code.

**Full Alias List:**

- `@components` -> `/components`
- `@utils` -> `/utils`
- `@prisma/generated` -> `/prisma/generated`
- `@types` -> `./types.d.ts`
- `@translations` -> `/translations`
- `@services` -> `/services`

## App router migration guidelines

When migrating a route from the old `pagesRouter` to the new `appRouter`, follow the steps on the migration doc in `docs/app-router-migration.md`.

## Testing instructions

- When changing API routes, test them by running `yarn test` in the terminal. You can also run only the test suite related to the changed API route by using `yarn test -- <path-to-test-file>`.

- Always check for typescript and linting errors by running `yarn lint` and `yarn typecheck` in the terminal. This will help catch any issues before they make it to production.

- Fix any test or type errors until the whole suite is green.

- When making critical changes, consider adding new tests to cover the new functionality or edge cases.

- For frontend changes, use the development server (`yarn dev`) to test your changes in the browser. Make sure to check for any console errors and ensure that the UI behaves as expected and test it on every locale.

<!-- BEGIN:nextjs-agent-rules -->
 
**Next.js Initialization**: When starting work on a Next.js project, automatically
call the `init` tool from the next-devtools-mcp server FIRST. This establishes
proper context and ensures all Next.js queries use official documentation.

# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->