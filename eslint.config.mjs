// eslint.config.js
import js from '@eslint/js';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

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
                'error',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: false,
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-console': 'error',

            // IGNORE
            'no-useless-escape': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    // Ignore console.log in util.ts
    {
        files: ['src/util.ts'],
        rules: {
            'no-console': 'off',
        },
    }
);
