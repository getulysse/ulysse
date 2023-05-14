import { getCurrentTask, createTask, stopCurrentTask } from '../toggl.mjs';

test('createTask', async () => {
    const task = await createTask();

    expect(task).toHaveProperty('id');
});

test('getCurrentTask', async () => {
    const task = await getCurrentTask();

    expect(task).toHaveProperty('id');
});

test('stopCurrentTask', async () => {
    await stopCurrentTask();

    const currentTask = await getCurrentTask();
    expect(currentTask).toEqual({});
});
