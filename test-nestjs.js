process.chdir('/Users/tebo1993/Desktop/EFTECH93/node-console/example-nestjs');
const path = require('path');
const Module = require('module');
require('/Users/tebo1993/Desktop/EFTECH93/node-console/node_modules/ts-node/register');
require('/Users/tebo1993/Desktop/EFTECH93/node-console/node_modules/tsconfig-paths/register');

const projectRequire = Module.createRequire(path.join('/Users/tebo1993/Desktop/EFTECH93/node-console/example-nestjs', 'package.json'));

try { projectRequire('reflect-metadata'); } catch {}

const appModule = projectRequire('/Users/tebo1993/Desktop/EFTECH93/node-console/example-nestjs/src/app.module.ts');
const AppModule = appModule.default || appModule.AppModule || Object.values(appModule)[0];
const { NestFactory } = projectRequire('@nestjs/core');
const { ExpressAdapter } = projectRequire('@nestjs/platform-express');

(async () => {
  try {
    console.log('Creating...');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(), { abortOnError: false });
    console.log('Created successfully!');
    await app.init();
    console.log('Init succeeded!');
    process.exit(0);
  } catch (err) {
    console.log('Caught error:', err.message);
    process.exit(0);
  }
})();
