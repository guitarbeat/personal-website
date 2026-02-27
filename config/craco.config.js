module.exports = {
  style: {
    sass: {
      loaderOptions: {
        additionalData: `
          @import "src/sass/abstracts/_variables.scss";
          @import "src/sass/abstracts/_mixins.scss";
        `,
      },
    },
  },
};
