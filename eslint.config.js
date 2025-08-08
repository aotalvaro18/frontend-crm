import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import configPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1. Configuraciones base recomendadas
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReactConfig,
    settings: {
      react: {
        version: 'detect', // Detecta automáticamente la versión de React
      },
    },
  },

  // 2. Plugins específicos para el ecosistema de React
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
      'jsx-a11y': pluginJsxA11y,
    },
    rules: {
      // Reglas de React Hooks (esenciales para evitar bugs)
      ...pluginReactHooks.configs.recommended.rules,
      // Regla para el Hot Reloading de Vite
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // 3. Reglas de accesibilidad (buenas prácticas)
  pluginJsxA11y.configs.recommended,
  
  // 4. Configuración para todo el proyecto (archivos .js, .ts, .jsx, .tsx)
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Variables globales del navegador (window, document, etc.)
        ...globals.node,    // Variables de Node.js (para archivos de config)
      },
      parser: tseslint.parser, // Usa el parser de TypeScript
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Habilita el parsing de JSX
        },
      },
    },
    rules: {
      // --- REGLAS PERSONALIZADAS Y MEJORAS ---

      // Desactivar reglas que TypeScript ya maneja mejor
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      // Calidad de Código
      'no-unused-vars': 'off', // Desactivar la regla base de JS
      '@typescript-eslint/no-unused-vars': [ // Usar la versión de TypeScript
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre el uso de 'any'
      'prefer-const': 'error', // Prefiere 'const' sobre 'let' si no hay reasignación

      // Limpieza y consistencia
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Permite console.warn y .error
      'eqeqeq': ['error', 'always'], // Requiere el uso de === y !==
    },
  },

  // 5. Desactivar reglas de formato que entran en conflicto con Prettier
  //    ¡¡IMPORTANTE!! Esto debe ir AL FINAL de la configuración.
  configPrettier,

  // 6. Ignorar directorios
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.vscode/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'amplify/.config/',
      'amplify/mock-data/',
      'amplify/backend/api/**/build',
    ],
  },
];