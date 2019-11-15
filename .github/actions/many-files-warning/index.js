const core = require("@actions/core");
const github = require("@actions/github");

// The GitHub API returns a maximum number of files
const fileListLimit = 300;

async function run() {
  const token = core.getInput("repo-token", { required: true });

  const prNumber = getPrNumber();
  if (!prNumber) {
    console.log("Could not get pull request number from context, exiting");
    return;
  }

  const { changed_files: changedFiles } = context.payload.pull_request;
  core.debug(`${changedFiles} file(s) reported as changed in #${prNumber}`);
  if (changedFiles >= fileListLimit) {
    core.debug(`met or exceeded API limit - commenting about it`);
    const client = new github.GitHub(token);
    commentOnlyOnce(
      client,
      prNumber,
      "🤖 Note: This PR contains 300 or more files. Some automatic labels may not have been applied."
    );
  }
}

function getPrNumber() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

async function commentOnlyOnce(client, prNumber, message) {
  const comments = await client.issues.listComments(issueDetails);
  const alreadyPosted = comments.data.map(c => c.body).includes(message);
  if (!alreadyPosted) {
    await client.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      body: message
    });
  }
}

run();
