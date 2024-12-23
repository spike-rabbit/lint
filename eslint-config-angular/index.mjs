/**
 * Copyright Siemens 2024.
 * SPDX-License-Identifier: MIT
 */
import eslintJs from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import angularEslint from 'angular-eslint';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import preferArrowPlugin from 'eslint-plugin-prefer-arrow';

// Keep in sync with eslint-config-typescript (except Angular stuff).
// dummy change
export const configBase = typescriptEslint.config({
  extends: [
    eslintJs.configs.recommended,
    ...typescriptEslint.configs.recommended,
    ...angularEslint.configs.tsRecommended
  ],
  plugins: {
    'import': importPlugin,
    'jsdoc': jsdocPlugin,
    'prefer-arrow': preferArrowPlugin
  },
  languageOptions: {
    parserOptions: {
      allowAutomaticSingleRunInference: true
    }
  },
  processor: angularEslint.processInlineTemplates,
  settings: {
    'import/ignore': ['node_modules']
  },
  rules: {
    '@angular-eslint/no-attribute-decorator': ['error'],
    '@angular-eslint/no-forward-ref': ['error'],
    '@angular-eslint/use-component-view-encapsulation': ['error'],

    'brace-style': ['off'],
    'comma-dangle': ['off'],
    'comma-spacing': ['off'],
    'func-call-spacing': ['off'],
    'indent': ['off'],
    'keyword-spacing': ['off'],
    'no-shadow': ['off'],
    'no-underscore-dangle': ['off'],
    'object-curly-spacing': ['off'],
    'space-infix-ops': ['off'],
    'space-before-blocks': ['off'],

    '@typescript-eslint/array-type': ['error'],
    '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    '@typescript-eslint/comma-dangle': ['error'],
    '@typescript-eslint/comma-spacing': ['error'],
    '@typescript-eslint/func-call-spacing': ['error'],
    '@typescript-eslint/indent': ['error', 2, { SwitchCase: 1 }],
    '@typescript-eslint/keyword-spacing': ['error'],
    '@typescript-eslint/member-ordering': ['off'],
    '@typescript-eslint/naming-convention': ['off'],
    '@typescript-eslint/no-non-null-asserted-optional-chain': ['error'],
    '@typescript-eslint/no-non-null-assertion': ['off'],
    '@typescript-eslint/no-require-imports': ['error'],
    '@typescript-eslint/no-shadow': ['error', { ignoreTypeValueShadow: true }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: false }
    ],
    '@typescript-eslint/no-var-requires': ['error'],
    '@typescript-eslint/space-infix-ops': ['error'],
    '@typescript-eslint/space-before-blocks': ['error'],
    '@typescript-eslint/type-annotation-spacing': ['error'],
    '@typescript-eslint/object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-empty-function': ['off'],
    '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
    '@typescript-eslint/consistent-type-assertions': ['error'],
    '@typescript-eslint/dot-notation': ['error'],
    '@typescript-eslint/no-unused-expressions': ['error'],
    '@typescript-eslint/prefer-for-of': ['error'],
    '@typescript-eslint/prefer-function-type': ['error'],
    '@typescript-eslint/unified-signatures': ['error'],

    'array-bracket-spacing': ['error'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': ['error'],
    'block-spacing': ['error'],
    'curly': ['error'],
    'jsdoc/newline-after-description': ['off'],
    'key-spacing': ['error'],
    'no-duplicate-imports': ['error'],
    'no-empty': ['error'],
    'no-irregular-whitespace': ['error'],
    'no-multi-spaces': ['error'],
    'no-multiple-empty-lines': ['error'],
    'prefer-arrow/prefer-arrow-functions': ['off'],
    'quote-props': ['error', 'consistent'],
    'semi-spacing': ['error'],
    'space-in-parens': ['error'],
    'space-unary-ops': ['error'],
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }]
  }
});

export const configRecommended = typescriptEslint.config({
  extends: [...angularEslint.configs.tsAll, ...configBase],
  rules: {
    camelcase: ['off'],
    'no-extra-semi': ['off'],
    'no-implied-eval': ['off'],
    'no-loop-func': ['off'],
    'no-useless-constructor': ['off'],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external'],
        alphabetize: {
          order: 'asc'
        },
        'newlines-between': 'always'
      }
    ],

    '@angular-eslint/component-max-inline-declarations': ['off'],
    '@angular-eslint/prefer-on-push-component-change-detection': ['off'],
    '@angular-eslint/use-component-selector': ['off'],
    '@angular-eslint/use-injectable-provided-in': ['off'],
    '@angular-eslint/no-host-metadata-property': ['off'],

    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase']
      },
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['camelCase', 'UPPER_CASE']
      },
      {
        selector: ['classProperty', 'parameterProperty'],
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'allow'
      },
      {
        selector: 'enumMember',
        format: ['PascalCase']
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow'
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      {
        selector: 'objectLiteralProperty',
        format: null
      },
      {
        selector: 'objectLiteralMethod',
        format: null
      },
      {
        selector: 'import',
        modifiers: ['default'],
        format: null
      }
    ],

    '@typescript-eslint/no-extra-semi': ['error'],
    '@typescript-eslint/no-for-in-array': ['error'],
    '@typescript-eslint/no-implied-eval': ['error'],
    '@typescript-eslint/no-loop-func': ['error'],
    '@typescript-eslint/no-this-alias': ['error'],
    '@typescript-eslint/no-useless-constructor': ['error'],
    '@typescript-eslint/prefer-includes': ['error'],
    '@typescript-eslint/prefer-literal-enum-member': ['error'],
    '@typescript-eslint/prefer-nullish-coalescing': [
      'error',
      {
        ignoreConditionalTests: true,
        ignoreMixedLogicalExpressions: true
      }
    ],
    '@typescript-eslint/prefer-optional-chain': ['error'],
    'prefer-arrow/prefer-arrow-functions': ['error']
  }
});

export default configRecommended;
