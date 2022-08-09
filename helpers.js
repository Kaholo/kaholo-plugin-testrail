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

function sanitizeHostname(hostname) {
  let sanitizedHostname = hostname;

  if (!/^https?:\/\//i.test(hostname)) {
    sanitizedHostname = `https://${sanitizedHostname}`;
  }
  if (sanitizedHostname.startsWith("http://")) {
    sanitizedHostname = `https://${sanitizedHostname.slice(7)}`;
  }

  return sanitizedHostname;
}

module.exports = {
  assertPathsExistence,
  sanitizeHostname,
};
