module.exports = {
  env: {
    node: true,
    mocha: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    "no-use-before-define": "off",
    "no-extend-native": "off",
    "max-len": ["error", { code: 150 }],
    "class-methods-use-this": "off",
    "no-plusplus": "off",
    "func-names": ["error", "never"],
    "arrow-parens": ["error", "as-needed"],
    "no-await-in-loop": "off",
  },
};
