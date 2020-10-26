const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const BASE_URI = 'https://api.todoist.com/rest/v1';
const http = axios.create({
  baseURL: BASE_URI,
  headers: {
    Authorization: `Bearer ${core.getInput('token')}`,
  },
});

const fetchProjectIdFromName = async (name) => {
  const response = await http.get('/projects');

  const projects = response.data;
  const project = projects.filter((project) => project.name === name).pop();

  return project ? project.id : null;
};

const createTask = async ({ content, projectId }) => {
  const body = {
    content,
    project_id: projectId,
  };
  const response = await http.post('/tasks', body);

  return response.data;
};

const run = async () => {
  try {
    const { context } = github;

    if (context.eventName !== 'issues') {
      throw new Error('Supported event issues only.');
    }

    const projectName = core.getInput('project-name');

    const projectId = await fetchProjectIdFromName(projectName);

    const { issue } = context.payload;
    const content = `#${issue.number} ${issue.title}`;
    const task = await createTask({ content, projectId });

    core.setOutput('message', JSON.stringify(task, null, 2));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
