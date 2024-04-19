// Nrwl
import { ensureNxProject, runNxCommand, uniq } from '@nx/plugin/testing';
import { existsSync } from 'fs';

describe('Happy-path', () => {
  let apiSpecLibName: string;
  let apiLibLibName: string;

  beforeAll(() => {
    ensureNxProject('@driimus/nx-plugin-openapi', 'dist/packages/nx-plugin-openapi');
  });

  beforeEach(() => {
    apiSpecLibName = uniq('api-spec');
    apiLibLibName = uniq('api-lib');
  });

  it.only('should work with a local spec', { timeout: 5000 }, () => {
    runNxCommand(`generate @driimus/nx-plugin-openapi:api-spec ${apiSpecLibName} --withSample`);

    runNxCommand(
      [
        'generate',
        '@driimus/nx-plugin-openapi:api-lib',
        apiLibLibName,
        '--generator=typescript-fetch',
        `--sourceSpecLib=${apiSpecLibName}`,
        `--sourceSpecFileRelativePath=src/${apiSpecLibName}.openapi.yml`,
      ].join(' '),
    );

    const execute = runNxCommand(`run ${apiLibLibName}:generate-sources`);

    // TODO devise proper expectations
    expect(execute).toContain('Done deleting outputDir');
    expect(existsSync(`./tmp/nx-e2e/proj/${apiLibLibName}/src/index.ts`)).toBe(true);
  });

  it('should work with docker', () => {
    runNxCommand(`generate @driimus/nx-plugin-openapi:api-spec ${apiSpecLibName} --withSample`);

    runNxCommand(
      [
        'generate',
        '@driimus/nx-plugin-openapi:api-lib',
        apiLibLibName,
        '--useDockerBuild=true',
        '--generator=typescript-fetch',
        `--sourceSpecLib=${apiSpecLibName}`,
        `--sourceSpecFileRelativePath=src/${apiSpecLibName}.openapi.yml`,
      ].join(' '),
    );

    const execute = runNxCommand(`run ${apiLibLibName}:generate-sources`);

    // TODO devise proper expectations
    expect(execute).toContain('Done deleting outputDir');
    expect(existsSync(`./tmp/nx-e2e/proj/${apiLibLibName}/src/index.ts`)).toBe(true);
  });

  it('should work with a remote spec', () => {
    runNxCommand(
      [
        'generate',
        '@driimus/nx-plugin-openapi:api-lib',
        apiLibLibName,
        '--generator=typescript-fetch',
        '--isRemoteSpec=true',
        '--sourceSpecUrl=https://petstore.swagger.io/v2/swagger.json',
      ].join(' '),
    );

    const execute = runNxCommand(`run ${apiLibLibName}:generate-sources`);

    // TODO devise proper expectations
    expect(execute).toContain('Done deleting outputDir');
  });

  describe('When using the --global-properties option', () => {
    it('should work with just one value', async () => {
      runNxCommand(`generate @driimus/nx-plugin-openapi:api-spec ${apiSpecLibName} --withSample`);

      runNxCommand(
        [
          'generate',
          '@driimus/nx-plugin-openapi:api-lib',
          apiLibLibName,
          '--generator=typescript-fetch',
          `--sourceSpecLib=${apiSpecLibName}`,
          `--sourceSpecFileRelativePath=src/${apiSpecLibName}.openapi.yml`,
          `--global-properties=apis`,
        ].join(' '),
      );

      const execute = runNxCommand(`run ${apiLibLibName}:generate-sources`);

      // TODO devise proper expectations
      expect(execute).toContain('Done deleting outputDir');
    });

    it('should work with multiple values', async () => {
      runNxCommand(`generate @driimus/nx-plugin-openapi:api-spec ${apiSpecLibName} --withSample`);

      runNxCommand(
        [
          'generate',
          '@driimus/nx-plugin-openapi:api-lib',
          apiLibLibName,
          '--generator=typescript-fetch',
          `--sourceSpecLib=${apiSpecLibName}`,
          `--sourceSpecFileRelativePath=src/${apiSpecLibName}.openapi.yml`,
          `--global-properties=apis,supportingFiles=runtime.ts`,
        ].join(' '),
      );

      const execute = runNxCommand(`run ${apiLibLibName}:generate-sources`);

      // TODO devise proper expectations
      expect(execute).toContain('Done deleting outputDir');
    });
  });
});
