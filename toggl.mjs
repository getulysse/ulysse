import { Toggl } from 'toggl-track';
import { config } from './utils.mjs';

const DEFAULT_CREATED_WITH = 'Ulysse';
const DEFAULT_DESCRIPTION = 'Deep work session';

const toggl = new Toggl({ auth: { token: config.toggl.token } });

export const getCurrentTask = async () => {
    try {
        const current = await toggl.timeEntry.current();
        return current || {};
    } catch (err) {
        return {};
    }
};

export const createTask = async () => {
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

export const stopCurrentTask = async () => {
    const currentTask = await getCurrentTask();
    await toggl.timeEntry.update(currentTask.id, config.toggl.workspaceId, { stop: new Date() });
};
