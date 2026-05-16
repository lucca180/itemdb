
## General guidelines

- Always refer to the official documentation for any framework or library you are using. This ensures that you are following best practices and using the most up-to-date information.

- When making changes to the codebase, ensure that you understand the existing code and how your changes will fit into it. This will help prevent introducing bugs or breaking existing functionality.

- Avoid running global commands such as `prettier`. Instead, use more contained commands that target specific files or directories. This helps prevent unintended changes to files that you did not intend to modify.

## Testing instructions

- When changing API routes, test them by running `yarn test` in the terminal. You can also run only the test suite related to the changed API route by using `yarn test -- <path-to-test-file>`.

- Always check for typescript and linting errors by running `yarn lint` and `yarn typecheck` in the terminal. This will help catch any issues before they make it to production.

- Fix any test or type errors until the whole suite is green.

- When making critical changes, consider adding new tests to cover the new functionality or edge cases.

- For frontend changes, use the development server (`yarn dev`) to test your changes in the browser. Make sure to check for any console errors and ensure that the UI behaves as expected.

<!-- BEGIN:nextjs-agent-rules -->
 
**Next.js Initialization**: When starting work on a Next.js project, automatically
call the `init` tool from the next-devtools-mcp server FIRST. This establishes
proper context and ensures all Next.js queries use official documentation.

# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->