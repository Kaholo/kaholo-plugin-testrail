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
  let sanitizedHostname = null;

  if (hostname.startsWith("https://")) {
    sanitizedHostname = hostname;
  } else if (hostname.startsWith("http://")) {
    sanitizedHostname = hostname.replace("http://", "https://");
  } else {
    sanitizedHostname = `https://${hostname}`;
  }

  return sanitizedHostname;
}

function joinUrlParts(...parts) {
  return parts.reduce((acc, cur) => (
    `${acc.replace(/\/*$/, "")}/${cur.replace(/^\/*/, "")}`
  ), parts.shift());
}

module.exports = {
  assertPathsExistence,
  sanitizeHostname,
  joinUrlParts,
};
