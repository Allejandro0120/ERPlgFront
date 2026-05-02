module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],
  plugins: ['simple-import-sort'],
  rules: {
    // Errores reales (importantes)
    'no-undef': 'error',

    //  Variables no usadas → warning (no molesta tanto)
    'no-unused-vars': 'warn',

    // Vue
    'vue/multi-word-component-names': 'off',

    //  Desactivar reglas molestas
    'vue/block-lang': 'off',

    //  Prettier manda en formato
    'prettier/prettier': 'error',

    'vue/script-indent': 'off',

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    // Ordenar claves de objetos y variables declaradas
    // `sort-keys` reordena las propiedades de los objetos (fixable)
    'sort-keys': ['error', 'asc', { caseSensitive: false, natural: true }],
    // `sort-vars` ordena variables dentro de la misma declaración (fixable)
    'sort-vars': ['error', { ignoreCase: false }],
  },
}
