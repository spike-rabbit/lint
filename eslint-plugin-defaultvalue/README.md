# eslint-plugin-defaultvalue

An ESLint plugin to automatically enrich TSDoc comments with default values (using --fix) or check if they are all correct.
The rule is aware of `Signals` by `@angular/core` and will automatically use the actual value instead of the whole `signal` function.

## Installation

Install `@siemens/eslint-plugin-defaultvalue` in your project.

```bash
npm install @siemens/eslint-plugin-defaultvalue --save-dev
```

## Configuration

Include the ESLint plugin and rule in your relevant `eslint.config.(m)js`:

```js
...
import defaultvalue from '@siemens/eslint-plugin-defaultvalue';

export default [
  {
    ...,
    plugins: {
      ...,
      defaultvalue
    },
    rules: {
      ...,
      'defaultvalue/tsdoc-defaultValue-annotation': ['error']
    }
  }
];
```
