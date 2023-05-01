import { unBlockRoot, blockHosts, blockApps, blockRoot } from './utils.mjs'; // eslint-disable-line

if (process.getuid() !== 0) {
    console.error('Please run this script as root or using sudo'); // eslint-disable-line
    process.exit(1);
}

await blockHosts();
await blockApps();
await blockRoot();
