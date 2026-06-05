// import fs from 'fs';
// import path from 'path';

// const treeShakeExists = () => {
//   return fs.existsSync(path.resolve(process.cwd(), 'translation/tree-shake/'));
// };

// wanted to move this code to the intlHandler.ts but without updating EVERY import in the codebase
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const loadTranslation = (locale: string, _relativePath: string, _isApp = false) => {
  return import(`../translation/${locale}.json`).then((res) => res.default);
};
