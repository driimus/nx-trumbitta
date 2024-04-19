// Devkit
import { GeneratorCallback, Tree, addDependenciesToPackageJson, runTasksInSerial } from '@nx/devkit';

// Nrwl

// Utils
import { openapiGeneratorCliVersion } from '../../utils/versions';

export default async function (tree: Tree) {
  const tasks: GeneratorCallback[] = [];

  // Add openapi-generator-cli to dev dependencies
  const addDependenciesTask = addDependenciesToPackageJson(
    tree,
    {},
    { '@openapitools/openapi-generator-cli': openapiGeneratorCliVersion },
  );
  tasks.push(addDependenciesTask);

  return runTasksInSerial(...tasks);
}
