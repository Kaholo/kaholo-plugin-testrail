const { default: axios } = require("axios");
const { createReadStream } = require("fs");
const TestrailApiClient = require("testrail-api");
const FormData = require("form-data");
const kaholoPluginLibrary = require("@kaholo/plugin-library");

const autocomplete = require("./autocomplete");
const {
  assertPathsExistence,
  sanitizeHostname,
  joinUrlParts,
} = require("./helpers");
const { execute } = require("./testrail-cli");

async function addTestRun(params) {
  const {
    username,
    apiKey,
    hostname,
    projectId,
    testRunName,
    milestoneId,
    assignedToId,
    description,
    testCases,
  } = params;

  const testRailClient = new TestrailApiClient({
    host: sanitizeHostname(hostname),
    user: username,
    password: apiKey,
  });

  const payload = {
    name: testRunName,
  };
  if (milestoneId) {
    payload.milestone_id = milestoneId;
  }
  if (assignedToId) {
    payload.assignedto_id = assignedToId;
  }
  if (description) {
    payload.description = description;
  }
  if (testCases) {
    payload.case_ids = testCases.map((testCase) => (
      testCase.toLowerCase().startsWith("c")
        ? testCase.slice(1)
        : testCase
    ));
  }

  const { body: addTestResultResponse } = await testRailClient.addRun(+projectId, payload);
  return addTestResultResponse;
}

async function addTestResult(params) {
  const {
    username,
    apiKey,
    hostname,
    testId,
    status,
    comment,
    attachments,
    assignedToId,
    version,
    timeElapsed,
    defects,
  } = params;

  const testRailClient = new TestrailApiClient({
    host: sanitizeHostname(hostname),
    user: username,
    password: apiKey,
  });

  const payload = {};
  if (status) {
    payload.status_id = +status;
  }
  if (comment) {
    payload.comment = comment;
  }
  if (assignedToId) {
    payload.assignedto_id = +assignedToId;
  }
  if (version) {
    payload.version = version;
  }
  if (timeElapsed) {
    payload.elapsed = timeElapsed;
  }
  if (defects) {
    payload.defects = defects;
  }

  const {
    body: addTestResultResponse,
  } = await testRailClient.addResult(testId, payload);

  if (attachments) {
    const addAttachmentResponses = await uploadAttachments({
      hostname,
      username,
      apiKey,
      paths: attachments,
      resultId: addTestResultResponse.id,
    });

    addTestResultResponse.attachment_ids = addAttachmentResponses.map(
      (addAttachmentResponse) => addAttachmentResponse.attachment_id,
    );
  }

  return addTestResultResponse;
}

async function uploadAttachments(params) {
  const {
    hostname,
    username,
    apiKey,
    paths,
    resultId,
  } = params;

  await assertPathsExistence(paths);

  const url = joinUrlParts(
    sanitizeHostname(hostname),
    "index.php?/api/v2/add_attachment_to_result",
    String(resultId),
  );

  const addAttachmentPromises = paths.map(async (path) => {
    const formData = new FormData();
    formData.append("attachment", createReadStream(path));

    const { data } = await axios({
      method: "POST",
      url,
      auth: {
        username,
        password: apiKey,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    });

    return data;
  });

  return Promise.all(addAttachmentPromises);
}

async function runCommand(params) {
  const result = await execute(params);
  return result;
}

async function getTests(params) {
  const {
    hostname,
    username,
    apiKey,
    runId,
    filter,
  } = params;

  const url = joinUrlParts(
    sanitizeHostname(hostname),
    "/index.php?/api/v2/get_tests",
    String(runId),
    filter ? `&status_id=${filter.replace(/\s/g, "")}` : "",
  );

  let response;
  try {
    response = await axios({
      method: "GET",
      url,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username,
        password: apiKey,
      },
    });
  } catch (e) {
    const errorMsg = e?.response?.data?.error ?? e;
    throw new Error(errorMsg);
  }

  return response.data.tests;
}

module.exports = kaholoPluginLibrary.bootstrap(
  {
    addTestRun,
    addTestResult,
    uploadAttachments,
    runCommand,
    getTests,
  },
  autocomplete,
);
