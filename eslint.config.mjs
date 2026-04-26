// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
     
export default tseslint.config(
       // Base configuration
       {
        ignores: ['dist', 'node_modules'],
      },
    
      // Recommended rules for JavaScript
      eslint.configs.recommended,
    
   // Recommended rules for TypeScript
   ...tseslint.configs.recommended,

   {
     files: ['src/**/*.ts'],
     rules:{
        '@typescript-eslint/no-explicit-any': 'off',
      }
     
    },

    // Configuration for test files
    {
      files: ['test/**/*.ts'],
      rules:{
        '@typescript-eslint/no-explicit-any': 'off',
      }
    },

    // Prettier configuration to disable conflicting rules
    prettierConfig,
);