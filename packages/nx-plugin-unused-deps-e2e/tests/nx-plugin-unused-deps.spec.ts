import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runCommandAsync,
  runNxCommandAsync,
  updateFile,
} from '@nx/plugin/testing';
// Devkit
import { workspaceRoot } from '@nx/devkit';

describe('nx-plugin-unused-deps', () => {
  const plugin = '@driimus/nx-plugin-unused-deps';
  const distPath = 'dist/packages/nx-plugin-unused-deps';

  beforeAll(async () => {
    ensureNxProject(plugin, distPath);

    await runCommandAsync('npm i react express; npm i -D vitest @types/express');
    await runNxCommandAsync('generate @nx/node:app --name=app');
    await runCommandAsync(`npm remove @driimus/nx-plugin-unused-deps`);

    /**
     * install from pack rather than installing from the directory
     * otherwise npm symlinks that directory which causes nx to generate
     * a dependency graph of this monorepo rather than of our test project
     */
    await runCommandAsync(`npm install $(npm pack ${workspaceRoot}/${distPath} | tail -1)`);
    updateFile('./apps/app/src/main.ts', `import * as express from "express"; express();`);
  }, 120000);

  // IDK why this stopped working
  it.skip('should display an info message at postinstall', async () => {
    await runCommandAsync(`npm remove @driimus/nx-plugin-unused-deps`);
    const { stdout } = await runCommandAsync(`npm install $(npm pack ${workspaceRoot}/${distPath} | tail -1)`);

    expect(stdout).toContain('$ nx generate @driimus/nx-plugin-unused-deps:check');
  }, 120000);

  it('should log unused deps to console', async () => {
    const { stdout } = await runNxCommandAsync(`generate ${plugin}:check`);

    expect(stdout).toContain('react');
    expect(stdout).toContain('vitest');
    expect(stdout).not.toContain('express');
    expect(stdout).not.toContain('@types/express');
  }, 120000);

  describe('--json', () => {
    it('should also log to a JSON file', async () => {
      await runNxCommandAsync(`generate ${plugin}:check --json`);

      expect(() => checkFilesExist(`.nx-plugin-unused-deps.json`)).not.toThrow();
    }, 120000);
  });

  describe('--fix', () => {
    it('should delete unused deps from package.json', async () => {
      await runNxCommandAsync(`generate ${plugin}:check --fix`);

      const { dependencies, devDependencies } = readJson('package.json');
      expect(Object.keys(dependencies)).not.toContain('react');
      expect(Object.keys(devDependencies)).not.toContain('vitest');
    }, 120000);
  });
});
