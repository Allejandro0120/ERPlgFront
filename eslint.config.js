import prettier from 'eslint-config-prettier'
import vuetify from 'eslint-config-vuetify'
import pluginPrettier from 'eslint-plugin-prettier'

export default vuetify(
  {
    ignores: ['dist/**', 'node_modules/**', '.git/**'],
  },
  {
    files: ['**/*.vue', '**/*.js', '**/*.jsx'],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  prettier,
)
