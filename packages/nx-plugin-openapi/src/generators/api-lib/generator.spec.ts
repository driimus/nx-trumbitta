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

  const defaultSchema = {
    name: 'my-lib',
    isRemoteSpec: false,
    generator: 'typescript-fetch',
    skipFormat: true,
  } satisfies ApiLibGeneratorSchema;

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  describe('not nested', () => {
    it.failing('should update tsconfig.base.json', async () => {
      await libraryGenerator(appTree, defaultSchema);
      const tsconfigJson = readJson(appTree, 'tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${defaultSchema.name}`]).toEqual([
        `libs/${defaultSchema.name}/src/index.ts`,
      ]);
    });

    it.failing('should update root tsconfig.base.json (no existing path mappings)', async () => {
      updateJson(appTree, 'tsconfig.base.json', (json) => {
        json.compilerOptions.paths = undefined;
        return json;
      });

      await libraryGenerator(appTree, defaultSchema);
      const tsconfigJson = readJson(appTree, '/tsconfig.base.json');

      expect(tsconfigJson.compilerOptions.paths[`@proj/${defaultSchema.name}`]).toEqual([
        `libs/${defaultSchema.name}/src/index.ts`,
      ]);
    });

    describe('When the API spec file is remote', () => {
      const sourceSpecUrl = 'http://foo.bar';
      const remoteSchema = {
        ...defaultSchema,
        isRemoteSpec: true,
        sourceSpecUrl,
      } satisfies ApiLibGeneratorSchema;

      it('should create or update project configuration', async () => {
        await libraryGenerator(appTree, remoteSchema);
        const options = {
          generator: remoteSchema.generator,
          sourceSpecPathOrUrl: sourceSpecUrl,
        } satisfies GenerateApiLibSourcesExecutorSchema;
        const { root, targets } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(root).toEqual(`libs/${remoteSchema.name}`);
        expect(targets?.['generate-sources']).toMatchObject({
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
      const localSchema = {
        ...defaultSchema,
        isRemoteSpec: false,
        sourceSpecLib: 'foo',
        sourceSpecFileRelativePath: 'src/bar.yml',
      } satisfies ApiLibGeneratorSchema;
      it('should update workspace.json', async () => {
        await libraryGenerator(appTree, localSchema);
        const options: GenerateApiLibSourcesExecutorSchema = {
          generator: localSchema.generator,
          sourceSpecPathOrUrl: ['libs', localSchema.sourceSpecLib, localSchema.sourceSpecFileRelativePath].join('/'),
        };
        const { root, targets } = readProjectConfiguration(appTree, defaultSchema.name);

        expect(root).toEqual(`libs/${localSchema.name}`);
        expect(targets?.['generate-sources']).toMatchObject({
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
