import { config, editConfig } from './config';
import { getRootDomain, removeDuplicates, getTimeType, createTimeout, isWithinTimeRange } from './utils';

export const clearWhitelist = async () => {
    if (config.shield.enable) return;

    config.whitelist = [];

    await editConfig(config);
};

export const whitelistDistraction = async (distraction) => {
    if (config.shield.enable) return;

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
    config.whitelist = config.whitelist.filter((d) => d.name !== distraction.name || d.type !== distraction.type);

    await editConfig(config);
};

export const isDistractionWhitelisted = (distraction) => {
    if (config.whitelist.some((d) => d.name.slice(0, 15) === distraction && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === distraction && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === '*' && isWithinTimeRange(d.time))) return true;
    if (config.whitelist.some((d) => d.name === `*.${getRootDomain(distraction)}` && isWithinTimeRange(d.time))) return true;

    return false;
};
