import fs from 'fs';
import { config, editConfig } from './config';
import { isDistractionWhitelisted } from './whitelist';
import { DOMAIN_REGEX } from './constants';
import { removeDuplicates, getRootDomain, getTimeType, createTimeout } from './utils';

export const blockDistraction = (distraction) => {
    config.blocklist = removeDuplicates([...config.blocklist, distraction]);
    config.blocklist = config.blocklist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    editConfig(config);
};

export const unblockDistraction = (distraction) => {
    if (config.shield) return;

    config.blocklist = config.blocklist.filter(({ name, time }) => JSON.stringify({ name, time }) !== JSON.stringify(distraction));

    editConfig(config);
};

export const isValidDomain = (domain) => DOMAIN_REGEX.test(domain);

export const isDomainBlocked = (domain, rule, rootDomain) => {
    if (!isValidDomain(domain)) return false;
    return rule === '*.*' || rule === domain || rule === `*.${rootDomain}` || rule === `*.${domain}`;
};

export const isWithinTimeRange = (time) => {
    if (!time || getTimeType(time) !== 'interval') return true;

    const [start, end] = time.split('-').map((t) => parseInt(t, 10));
    const hour = new Date().getHours();

    return hour >= start && hour < end;
};

export const isDistractionBlocked = (distraction) => {
    if (isDistractionWhitelisted(distraction)) return false;

    const rootDomain = getRootDomain(distraction);
    const { blocklist } = config;

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

    if (name === '*.*') return true;

    if (name.includes('*.')) {
        const [, domain] = name.split('*.');
        return isValidDomain(domain);
    }

    return isValidDomain(name) || isValidApp(name);
};
