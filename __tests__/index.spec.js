import { execSync } from 'child_process';
import { description, version } from '../package.json';

const ulysse = 'node -r @babel/register src/index.js';

test('Should display the version', async () => {
    const output = execSync(`${ulysse} -v`);

    expect(output.toString().trim()).toBe(version);
});

test('Should display the help', async () => {
    const output = execSync(`${ulysse} -h`);

    expect(output.toString().trim()).toContain(description);
});
