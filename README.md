# Kaholo TestRail Plugin
This plugin integrates TestRail with Kaholo, providing access to TestRail's API, for example adding a new Test Run or uploading Test Result's attachments.
## Access and Authentication
The plugin accesses TestRail API using the hostname from the URL of your TestRail environment, for example: if the TestRail app's URL is "http://testrail.example.com/testrail/index.php?/..." then the Hostname parameter required by plugin is "http://testrail.example.com/testrail". Plugin requires API key and username (email) to authenticate to API and send authorized requests, to obtain an API key go to the Settings > API Keys in your TestRail environment.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Plugin Account Parameters
* Username (string) - Username (email) used to log into the TestRail account
* API Key (vault) - API key for your TestRail account. You can generate one in TestRail Settings > API Keys
* Hostname (string) - Hostname (URL) of your TestRail environment

## Method: Add Test Run
This method allows to add a new Test Run in your TestRail environment.

### Parameters
Required parameters have an asterisk (*) next to their names.
* Project * - Project in your TestRail environment, selected from an autocompleted drop-down list
* Test Run Name * (string) - Name of the Test Run
* Milestone - Milestone to link to the Test Run, selected from an autocompleted drop-down list
* Assigned To - User the Test Run should be assigned to, selected from an autocompleted drop-down list
* Description (text) - Description of the Test Run
* Test Cases (text) - Test Cases for the custom case selection, one Test Case ID per line, e.g.:
  ```
  C1
  C2
  C3
  ```
  You do not have to specify the letter "C" at the beginning of every Test Case ID

## Method: Add Test Result
This method allows to add Test Result to already existing Tests in specific Test Run.

### Parameters
Required parameters have an asterisk (*) next to their names.
* Project * - Project in your TestRail environment, selected from an autocompleted drop-down list
* Test Run * - Test Run which contains the Test to add the result to, selected from an autocompleted drop-down list
* Test * - Test to add the result to, selected from an autocompleted drop-down list
* Status * - Status of the result, selected from an autocompleted drop-down list
* Comment (text) - The comment/description for the result
* Attachments (text) - Paths to the files on the agent, that will be used as attachments in the result, one path per line
* Assigned To - User the test is assigned to, selected from an autocompleted drop-down list
* Version (string) - Version or build you tested against
* Time Elapsed (string) - Time it took to execute the test, e.g. "30s" or "1m 45s"
* Defects (string) - A comma-separated list of defects to link to the test result

## Method: Upload Attachments
This method allows to add attachments to Test Result

### Parameters
* Project * - Project in your TestRail environment, selected from an autocompleted drop-down list
* Test Run * - Test Run which contains the Test to add the result to, selected from an autocompleted drop-down list
* Result * - Test Result the attachments should be added to, selected from an autocompleted drop-down list
* Paths * (text) - Paths to the files on the agent, one path per line
