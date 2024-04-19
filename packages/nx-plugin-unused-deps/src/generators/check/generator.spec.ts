import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addDependenciesToPackageJson, logger } from '@nx/devkit';
import * as devkit from '@nx/devkit';

import generator from './generator';

// Models
import { CheckGeneratorSchema } from './schema';
import { PackageJsonDeps } from './package-json-deps.model';

describe('check generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace(2);
    addDependenciesToPackageJson(appTree, { react: 'latest' }, { vitest: 'latest' });
  });

  it('should log to console with no options', async () => {
    const options: CheckGeneratorSchema = {};
    const spy = vitest.spyOn(logger, 'log');
    const mockPackageJsonDeps: PackageJsonDeps = {
      dependencies: ['react'],
      devDependencies: ['vitest'],
    };

    await generator(appTree, options);

    expect(spy).toHaveBeenCalledWith(mockPackageJsonDeps);
  });

  it('should log to file when requested', async () => {
    const options: CheckGeneratorSchema = { json: true };
    const spy = vitest.spyOn(devkit, 'writeJsonFile').mockImplementation(() => null);

    await generator(appTree, options);

    expect(spy).toHaveBeenCalled();
  });

  it('should update package.json when requested', async () => {
    const options: CheckGeneratorSchema = { fix: true };
    const spy = vitest.spyOn(devkit, 'removeDependenciesFromPackageJson').mockImplementation(() => null);

    await generator(appTree, options);

    expect(spy).toHaveBeenCalled();
  });
});
