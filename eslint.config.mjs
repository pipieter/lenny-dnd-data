// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
      ],

      // IGNORE
      'no-useless-escape': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
