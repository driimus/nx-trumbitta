// Nrwl
import { Tree, readJson, readProjectConfiguration, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

// Generator
import libraryGenerator from './generator';

// Schemas
import { GenerateApiLibSourcesExecutorSchema } from '../../executors/generate-api-lib-sources/schema';
import { ApiLibGeneratorSchema } from './schema';

describe('api-lib schematic', () => {
  let appTree: Tree;

  const defaultSchema: ApiLibGeneratorSchema = {
    name: 'my-lib',
    isRemoteSpec: false,
    generator: 'typescript-fetch',
    skipFormat: true,
  };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace();
  });

  describe('not nested', () => {
    it('should update tsconfig.base.json', async () => {
      await libraryGenerator(appTree, defaultSchema);
      const tsconfigJson = readJson(appTree, 'tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${defaultSchema.name}`]).toEqual([
        `${defaultSchema.name}/src/index.ts`,
      ]);
    });

    it('should update root tsconfig.base.json (no existing path mappings)', async () => {
      updateJson(appTree, 'tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      });

      await libraryGenerator(appTree, defaultSchema);
      const tsconfigJson = readJson(appTree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${defaultSchema.name}`]).toEqual([
        `${defaultSchema.name}/src/index.ts`,
      ]);
    });

    describe('When the API spec file is remote', () => {
      const sourceSpecUrl = 'http://foo.bar';
      const remoteSchema: ApiLibGeneratorSchema = {
        ...defaultSchema,
        isRemoteSpec: true,
        sourceSpecUrl,
      };

      it('should create or update project configuration', async () => {
        await libraryGenerator(appTree, remoteSchema);
        const options: GenerateApiLibSourcesExecutorSchema = {
          generator: remoteSchema.generator!,
          sourceSpecPathOrUrl: sourceSpecUrl,
        };
        const { root, targets } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(root).toEqual(`${remoteSchema.name}`);
        expect(targets!['generate-sources']).toMatchObject({
          executor: '@driimus/nx-plugin-openapi:generate-api-lib-sources',
          options,
        });
      });

      it('should NOT add implicitDependencies to project configuration', async () => {
        await libraryGenerator(appTree, remoteSchema);
        const { implicitDependencies } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(implicitDependencies).toBeFalsy();
      });
    });

    describe('When the API spec file is local', () => {
      const localSchema: ApiLibGeneratorSchema = {
        ...defaultSchema,
        isRemoteSpec: false,
        sourceSpecLib: 'foo',
        sourceSpecFileRelativePath: 'src/bar.yml',
      };
      it('should update workspace.json', async () => {
        await libraryGenerator(appTree, localSchema);
        const options: GenerateApiLibSourcesExecutorSchema = {
          generator: localSchema.generator!,
          sourceSpecPathOrUrl: ['libs', localSchema.sourceSpecLib, localSchema.sourceSpecFileRelativePath].join('/'),
        };
        const { root, targets } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(root).toEqual(`${localSchema.name}`);
        expect(targets!['generate-sources']).toMatchObject({
          executor: '@driimus/nx-plugin-openapi:generate-api-lib-sources',
          options,
        });
      });

      it('should add implicitDependencies to project configuration', async () => {
        await libraryGenerator(appTree, localSchema);
        const { implicitDependencies } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(implicitDependencies).toEqual([localSchema.sourceSpecLib]);
      });
    });
  });
});
