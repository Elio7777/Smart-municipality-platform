import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// `npm run lint` only checks the React frontend (src/**). The Node
// backend (controllers/, routes/, middleware/, config/, server.js)
// uses CommonJS and runs in Node — it doesn't need React rules and
// doesn't share browser globals.
export default defineConfig([
  globalIgnores([
    'dist',
    'dev-dist',
    'node_modules',
    'public',
    'uploads',
    'controllers',
    'routes',
    'middleware',
    'config',
    'server.js',
    '*.config.{js,mjs}',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The v7 react-hooks plugin adds aggressive rules that flag
      // common, working patterns. Relax them so the lint output
      // surfaces only real problems.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      // Allow unused fn args prefixed with `_` (catch (_e) etc.)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Context files export both a Provider component and a hook —
    // standard React Context pattern. The Vite refresh rule prefers
    // single-component exports, but splitting just for that adds
    // friction for no functional gain.
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
