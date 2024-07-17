import { GUN_SERVER } from './constants';
import { config, editConfig } from './config';
import { getRootDomain, removeDuplicates, getTimeType, createTimeout, isWithinTimeRange } from './utils';

export const whitelistDistraction = async (distraction) => {
    if (config.shield) return;

    config.whitelist = removeDuplicates([...config.whitelist, distraction]);
    config.whitelist = config.whitelist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    await editConfig(config);
};

export const unwhitelistDistraction = async (distraction) => {
    if (config.shield) return;

    config.whitelist = config.whitelist.filter(({ name, time }) => JSON.stringify({ name, time }) !== JSON.stringify(distraction));

    await editConfig(config);
};

export const isDistractionWhitelisted = (distraction) => {
    if (distraction.name === new URL(GUN_SERVER).hostname) return true;
    if (config.whitelist.some((d) => d.name.slice(0, 15) === distraction && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === distraction && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === '*' && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === `*.${getRootDomain(distraction)}` && isWithinTimeRange(d.time))) return true;

    return false;
};
