import * as core from "@actions/core";
import * as github from "@actions/github";

// The GitHub API returns a maximum number of files
const fileListLimit = 300;

async function run() {
  const token = core.getInput("repo-token", { required: true });

  const prNumber = getPrNumber();
  if (!prNumber) {
    console.log("Could not get pull request number from context, exiting");
    return;
  }

  const client = new github.GitHub(token);

  core.debug(`fetching changed files for pr #${prNumber}`);
  const count = await getChangedFilesCount(client, prNumber);
  core.debug(`file(s) reported as changed: ${count}`);

  if (changedFiles >= fileListLimit) {
    core.debug(`met or exceeded API limit - commenting about it`);
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

async function getChangedFilesCount(client, prNumber) {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });

  return listFilesResponse.data.length;
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
