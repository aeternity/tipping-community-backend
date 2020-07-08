module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    mocha: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    'no-extend-native': 'off',
    'max-len': ['error', { code: 150 }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'func-names': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed'],
  },
};
