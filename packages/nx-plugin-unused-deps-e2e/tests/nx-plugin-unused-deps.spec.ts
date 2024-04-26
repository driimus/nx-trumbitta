import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runCommandAsync,
  runNxCommandAsync,
  updateFile,
} from '@nx/plugin/testing';

describe('nx-plugin-unused-deps', () => {
  const plugin = '@driimus/nx-plugin-unused-deps';
  const distPath = 'dist/packages/nx-plugin-unused-deps';

  beforeAll(async () => {
    ensureNxProject(plugin, distPath);

    await runNxCommandAsync('g @nx/node:application --name=app');
    await runCommandAsync(`pnpm remove @driimus/nx-plugin-unused-deps`);

    /**
     * install from pack rather than installing from the directory
     * otherwise npm symlinks that directory which causes nx to generate
     * a dependency graph of this monorepo rather than of our test project
     */
    await runCommandAsync(`pnpm add @driimus/nx-plugin-unused-deps`);
    updateFile('./app/src/main.ts', `console.log('test')`);
  }, 120_000);

  // IDK why this stopped working
  it.skip('should display an info message at postinstall', async () => {
    await runCommandAsync(`pnpm remove @driimus/nx-plugin-unused-deps`);
    const { stdout } = await runCommandAsync(`pnpm install @driimus/nx-plugin-unused-deps`);

    expect(stdout).toContain('$ nx generate @driimus/nx-plugin-unused-deps:check');
  }, 10_000);

  it('should log unused deps to console', async () => {
    const { stdout } = await runNxCommandAsync(`generate ${plugin}:check`);

    expect(stdout).toContain('react');
    expect(stdout).toContain('vitest');
    expect(stdout).not.toContain('express');
    expect(stdout).not.toContain('@types/express');
  }, 10_000);

  describe('--json', () => {
    it('should also log to a JSON file', async () => {
      await runNxCommandAsync(`generate ${plugin}:check --json`);

      expect(() => checkFilesExist(`.nx-plugin-unused-deps.json`)).not.toThrow();
    }, 10_000);
  });

  describe('--fix', () => {
    it('should delete unused deps from package.json', async () => {
      await runNxCommandAsync(`generate ${plugin}:check --fix`);

      const { dependencies, devDependencies } = readJson('package.json');
      expect(Object.keys(dependencies)).not.toContain('react');
      expect(Object.keys(devDependencies)).not.toContain('vitest');
    }, 10_000);
  });
});
