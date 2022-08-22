const TestrailApiClient = require("testrail-api");
const { default: axios } = require("axios");

const {
  sanitizeHostname,
  joinUrlParts,
} = require("./helpers");

function createAutocompleteFunction({
  fetchResult,
  itemsDataPath,
  idPath,
  valuePath,
  checkForNestedItems,
}) {
  return async (query, params) => {
    const numericalParams = ["projectId", "runId"];
    const parsedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        numericalParams.includes(key) ? Number(value) : value,
      ]),
    );

    const {
      hostname,
      username,
      apiKey,
    } = parsedParams;

    const testRailClient = new TestrailApiClient({
      host: sanitizeHostname(hostname),
      user: username,
      password: apiKey,
    });

    const { body: result } = await fetchResult(testRailClient, parsedParams);
    const items = itemsDataPath ? result[itemsDataPath] : result;

    if (checkForNestedItems) {
      const nestedItems = items.reduce((acc, cur) => {
        if (!cur[itemsDataPath]) {
          return acc;
        }
        return [...acc, ...cur[itemsDataPath]];
      }, []);
      items.push(...nestedItems);
    }

    return mapAndFilterItems(items, query, { valuePath, idPath });
  };
}

async function listUsers(query, params) {
  const {
    projectId,
    hostname,
    username,
    apiKey,
  } = params;
  const url = joinUrlParts(
    sanitizeHostname(hostname),
    "index.php?/api/v2/get_users",
    String(projectId),
  );

  const { data } = await axios({
    method: "GET",
    url,
    auth: {
      username,
      password: apiKey,
    },
  });

  return mapAndFilterItems(data, query, {});
}

function mapAndFilterItems(
  items,
  query,
  {
    valuePath = "name",
    idPath = "id",
  },
) {
  const autocompleteItems = items.map((item) => ({
    id: String(item[idPath]),
    value: item[valuePath],
  }));

  if (!query) {
    return autocompleteItems;
  }

  const lowerCaseQuery = query.toLowerCase();
  return autocompleteItems.filter((item) => (
    item.id.toLowerCase().includes(lowerCaseQuery)
    || item.value.toLowerCase().includes(lowerCaseQuery)
  ));
}

module.exports = {
  listProjects: createAutocompleteFunction({
    fetchResult: (testRailClient) => testRailClient.getProjects(),
    itemsDataPath: "projects",
  }),
  listMilestones: createAutocompleteFunction({
    fetchResult: (testRailClient, { projectId }) => testRailClient.getMilestones(projectId),
    itemsDataPath: "milestones",
    checkForNestedItems: true,
  }),
  listTestsForRun: createAutocompleteFunction({
    fetchResult: (testRailClient, { runId }) => testRailClient.getTests(runId),
    itemsDataPath: "tests",
    valuePath: "title",
  }),
  listRuns: createAutocompleteFunction({
    fetchResult: (testRailClient, { projectId }) => testRailClient.getRuns(projectId),
    itemsDataPath: "runs",
  }),
  listStatuses: createAutocompleteFunction({
    fetchResult: (testRailClient) => testRailClient.getStatuses(),
    valuePath: "label",
  }),
  listResultsForRun: createAutocompleteFunction({
    fetchResult: (testRailClient, { runId }) => testRailClient.getResultsForRun(runId),
    itemsDataPath: "results",
    valuePath: "comment",
  }),
  listUsers,
};
