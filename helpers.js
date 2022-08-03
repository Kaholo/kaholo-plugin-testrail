const fs = require("fs");
const { access } = require("fs/promises");

async function assertPathsExistence(paths) {
  await Promise.all(
    paths.map(async (path) => {
      try {
        await access(path, fs.constants.F_OK);
        return true;
      } catch {
        throw new Error(`Path ${path} does not exist on the agent`);
      }
    }),
  );
}

module.exports = {
  assertPathsExistence,
};
