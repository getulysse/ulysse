import { Toggl } from 'toggl-track';
import { config } from './utils.mjs';

const DEFAULT_CREATED_WITH = 'Ulysse';
const DEFAULT_DESCRIPTION = 'Deep work session';

const toggl = new Toggl({ auth: { token: config.toggl.token } });

const createTask = async () => {
    const data = {
        start: new Date(),
        duration: -Math.floor(Date.now() / 1000),
        created_with: DEFAULT_CREATED_WITH,
        description: DEFAULT_DESCRIPTION,
        project_id: config.toggl.projectId,
        wid: config.toggl.workspaceId,
    };
    const res = await toggl.timeEntry.create(config.toggl.workspaceId, data);
    return res;
};

const stopTask = async (timeEntryId) => {
    await toggl.timeEntry.update(timeEntryId, config.toggl.workspaceId, { stop: new Date() });
};

const getCurrentTask = async () => {
    const current = await toggl.timeEntry.current();
    return current || {};
};

export default { createTask, stopTask, getCurrentTask };
