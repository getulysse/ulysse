import fs from 'fs';
import { config, editConfig } from './config';
import { isDistractionWhitelisted } from './whitelist';
import { DOMAIN_REGEX } from './constants';
import { removeDuplicates, getRootDomain, getRunningApps, getTimeType, createTimeout, isWithinTimeRange } from './utils';

export const blockDistraction = async (distraction) => {
    config.blocklist = removeDuplicates([...config.blocklist, distraction]);
    config.blocklist = config.blocklist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    await editConfig(config);
};

export const unblockDistraction = async (distraction) => {
    if (config.shield) return;

    config.blocklist = config.blocklist.filter(({ name, time }) => JSON.stringify({ name, time }) !== JSON.stringify(distraction));

    await editConfig(config);
};

export const isValidDomain = (domain) => DOMAIN_REGEX.test(domain);

export const isDomainBlocked = (domain, rule, rootDomain) => {
    if (!isValidDomain(domain)) return false;
    return rule === '*.*' || rule === domain || rule === `*.${rootDomain}` || rule === `*.${domain}`;
};

export const isDistractionBlocked = (distraction) => {
    if (isDistractionWhitelisted(distraction)) return false;

    const rootDomain = getRootDomain(distraction);
    const { blocklist } = config;

    if (blocklist.some(({ name, time }) => name === '*' && isWithinTimeRange(time))) return true;

    return blocklist.some(({ name, time }) => (name === distraction || isDomainBlocked(distraction, name, rootDomain)) && isWithinTimeRange(time));
};

export const isValidApp = (app) => {
    const paths = process.env.PATH.split(':');

    if (!app) return false;

    if (fs.existsSync(app)) return true;

    return paths.some((path) => fs.existsSync(`${path}/${app}`));
};

const isValidTime = (time) => getTimeType(time) !== 'unknown';

export const isValidDistraction = (distraction) => {
    const { name = '', time = '' } = distraction;

    if (time && !isValidTime(time)) return false;

    if (['*.*', '*'].includes(name)) return true;

    if (name.includes('*.')) {
        const [, domain] = name.split('*.');
        return isValidDomain(domain);
    }

    return isValidDomain(name) || isValidApp(name);
};

export const getBlockedApps = () => {
    const { blocklist } = config;

    const isApp = (name) => !isValidDomain(name);

    return blocklist
        .filter(({ name }) => isApp(name))
        .filter(({ time }) => isWithinTimeRange(time))
        .filter(({ name }) => !isDistractionWhitelisted(name))
        .map(({ name }) => name);
};

export const getRunningBlockedApps = () => {
    const runningApps = getRunningApps();
    const blockedApps = getBlockedApps();

    if (blockedApps.includes('*')) {
        return runningApps.filter(({ name }) => !isDistractionWhitelisted(name));
    }

    const isBlockedApp = (app) => blockedApps.includes(app.name) || blockedApps.includes(app.bin) || blockedApps.includes(app.cmd);

    return runningApps.filter(isBlockedApp);
};
