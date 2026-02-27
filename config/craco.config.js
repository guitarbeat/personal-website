const path = require("node:path");
const { execSync } = require("node:child_process");

// * Get git commit hash for version info
const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn("Could not get git commit hash:", error.message);
    return "unknown";
  }
};

// * Get build date
const getBuildDate = () => {
  return new Date().toISOString();
};

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // * Inject version information as environment variables
      const commitHash = getGitCommitHash();
      const buildDate = getBuildDate();

      const webpack = require("webpack");
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          "process.env.REACT_APP_GIT_COMMIT_HASH": JSON.stringify(commitHash),
          "process.env.REACT_APP_BUILD_DATE": JSON.stringify(buildDate),
          "process.env.REACT_APP_VERSION": JSON.stringify(
            require("../package.json").version,
          ),
        }),
      );

      // Explicitly disable ESLint plugin in webpack config
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== "ESLintWebpackPlugin"
      );

      return webpackConfig;
    },
  },
  // Ensure craco doesn't add it back
  eslint: {
    enable: false,
    mode: 'file',
  },
  style: {
    sass: {
      loaderOptions: {
        implementation: require("sass"),
        api: "modern",
        sourceMap: process.env.NODE_ENV !== "production",
        sassOptions: {
          outputStyle:
            process.env.NODE_ENV === "production" ? "compressed" : "expanded",
          includePaths: [
            path.join(__dirname, "..", "src/sass"),
            path.join(__dirname, "..", "src/sass/theme"),
            path.join(__dirname, "..", "src/sass"),
          ],
          fiber: false,
        },
      },
    },
    css: {
      loaderOptions: {
        sourceMap: process.env.NODE_ENV !== "production",
      },
    },
    postcss: {
      loaderOptions: {
        sourceMap: process.env.NODE_ENV !== "production",
      },
    },
  },
};
