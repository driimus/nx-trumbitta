import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/**',
  {
    plugins: [nxViteTsPaths()],
    test: {
      globals: true,
    },
  },
]);
