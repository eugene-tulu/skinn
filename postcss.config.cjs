const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')

module.exports = function(ctx) {
  const file = (ctx && ctx.file) || ''
  if (file.includes('node_modules')) {
    return { plugins: { autoprefixer: autoprefixer } }
  }
  return {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
}
