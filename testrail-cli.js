const childProcess = require("child_process");
const { promisify } = require("util");
const { docker } = require("@kaholo/plugin-library");
const { access } = require("fs/promises");
const { resolve: resolvePath } = require("path");

const fs = require("fs");

const exec = promisify(childProcess.exec);

const {
  TESTRAIL_CLI_NAME, PYTHON_DOCKER_IMAGE, TESTRAIL_INSTALL_TRCLI_COMMANDS,
} = require("./consts.json");

const execute = async (params) => {
  const {
    username,
    apiKey,
    hostname,
    workingDir,
    project,
    title,
    resultsFile,
  } = params;

  const testRailCmd = buildTestRailCommand(
    hostname,
    username,
    apiKey,
    project,
    title,
    resultsFile,
  );

  const trCliInstallCommands = TESTRAIL_INSTALL_TRCLI_COMMANDS.join("; ");

  const combinedCommands = `${trCliInstallCommands}; ${testRailCmd}`;

  const dockerCommandBuildOptions = {
    command: docker.sanitizeCommand(combinedCommands),
    image: PYTHON_DOCKER_IMAGE,
  };

  const dockerEnvironmentalVariables = {};
  const volumeDefinitionsArray = [];
  let shellEnvironmentalVariables = {};

  const workingDirVolumeDefinition = await createWorkingDirVolumeDef(workingDir || process.cwd());

  dockerEnvironmentalVariables[workingDirVolumeDefinition.mountPoint.name] = (
    workingDirVolumeDefinition.mountPoint.value
  );

  shellEnvironmentalVariables = {
    ...dockerEnvironmentalVariables,
    [workingDirVolumeDefinition.path.name]: workingDirVolumeDefinition.path.value,
  };

  volumeDefinitionsArray.push(workingDirVolumeDefinition);
  dockerCommandBuildOptions.workingDirectory = workingDirVolumeDefinition.mountPoint.value;

  dockerCommandBuildOptions.volumeDefinitionsArray = volumeDefinitionsArray;
  dockerCommandBuildOptions.environmentVariables = dockerEnvironmentalVariables;

  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  const output = { stdout: "", stderr: "" };

  const commandOutput = await exec(dockerCommand, {
    env: shellEnvironmentalVariables,
  }).catch((error) => {
    output.stdout = error.stdout;
    output.stderr = error.stderr;
  });

  if (commandOutput?.stderr !== "" && commandOutput?.stderr !== undefined) {
    console.error(commandOutput.stderr);
    output.cmderr = commandOutput.stderr;
  }

  if (commandOutput?.stdout !== "" && commandOutput?.stdout !== undefined) {
    return commandOutput.stdout;
  }

  if (output.stderr !== "") {
    throw new Error(output.stderr);
  }

  if (output.stdout !== "") {
    return output.stdout;
  }

  throw new Error(output);
};

async function assertPathExistence(path) {
  try {
    await access(path, fs.constants.F_OK);
  } catch {
    throw new Error(`Path ${path} does not exist`);
  }
}

function buildTestRailCommand(hostname, username, apiKey, project, title, resultsFile) {
  return `${TESTRAIL_CLI_NAME} -h ${hostname} --project ${project} --username ${username} --password ${apiKey} parse_junit --title "${title}" -f ${resultsFile}`;
}

async function createWorkingDirVolumeDef(workingDir) {
  const absoluteWorkingDirectory = resolvePath(workingDir);
  console.info("absoluteWorkingDirectory: ", absoluteWorkingDirectory);

  await assertPathExistence(absoluteWorkingDirectory);
  const workingDirVolumeDefinition = docker.createVolumeDefinition(absoluteWorkingDirectory);
  return workingDirVolumeDefinition;
}

module.exports = {
  execute,
};
