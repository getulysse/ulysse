/* eslint-disable no-use-before-define */
import { Select, Input, AutoComplete } from 'enquirer';
import { config, editConfig } from './config';
import { getAllApps } from './utils';
import { unblockDistraction, blockDistraction } from './block';
import { unwhitelistDistraction, whitelistDistraction } from './whitelist';

let profile;

const blockDistractionMenu = async () => {
    const blockDistractionPrompt = new Select({
        name: 'blockDistraction',
        message: 'Block a distraction',
        choices: ['Block a website', 'Block an application', 'Back'],
    });

    const blockDistractionChoice = await blockDistractionPrompt.run();

    if (blockDistractionChoice === 'Block a website') {
        const websitePrompt = new Input({ message: 'Enter the website to block' });
        const website = await websitePrompt.run();

        blockDistraction({ name: website, profile });
    }

    if (blockDistractionChoice === 'Block an application') {
        const appPrompt = new AutoComplete({ message: 'Enter the application to block', choices: getAllApps(), limit: 20 });
        const app = await appPrompt.run();

        blockDistraction({ name: app, profile });
    }

    return updateProfileMenu();
};

const unblockDistractionMenu = async () => {
    const blocklist = config.blocklist.filter((d) => d.profile === profile).map((d) => d.name);
    const prompt = new Select({
        name: 'unblockDistraction',
        message: 'Unblock a distraction',
        choices: [...blocklist, 'Back'],
    });

    const choice = await prompt.run();

    if (choice === 'Back') return updateProfileMenu();

    unblockDistraction({ name: choice });

    return updateProfileMenu();
};

const whitelistDistractionMenu = async () => {
    const whitelistDistractionPrompt = new Select({
        name: 'whitelistDistraction',
        message: 'Whitelist a distraction',
        choices: ['Whitelist a website', 'Whitelist an application', 'Back'],
    });

    const whitelistDistractionChoice = await whitelistDistractionPrompt.run();

    if (whitelistDistractionChoice === 'Whitelist a website') {
        const websitePrompt = new Input({ message: 'Enter the website to whitelist' });
        const website = await websitePrompt.run();

        whitelistDistraction({ name: website, profile });
    }

    if (whitelistDistractionChoice === 'Whitelist an application') {
        const appPrompt = new AutoComplete({ message: 'Enter the application to whitelist', choices: getAllApps(), limit: 20 });
        const app = await appPrompt.run();

        whitelistDistraction({ name: app, profile });
    }

    return updateProfileMenu();
};

const unwhitelistDistractionMenu = async () => {
    const prompt = new Select({
        name: 'unwhitelistDistraction',
        message: 'Unwhitelist a distraction',
        choices: [...config.whitelist.filter((d) => d.profile === profile).map((d) => d.name), 'Back'],
    });

    const choice = await prompt.run();

    if (choice === 'Back') return updateProfileMenu();

    unwhitelistDistraction({ name: choice });

    return updateProfileMenu();
};

const enableProfileMenu = async () => {
    config.profiles = config.profiles.map((p) => {
        if (p.name === profile) {
            return { ...p, enabled: true };
        }

        return p;
    });

    await editConfig(config);

    return updateProfileMenu();
};

const disableProfileMenu = async () => {
    config.profiles = config.profiles.map((p) => {
        if (p.name === profile) {
            return { ...p, enabled: false };
        }

        return p;
    });

    await editConfig(config);

    return updateProfileMenu();
};

const selectProfile = async () => {
    const profiles = config.profiles.map((p) => p.name).sort((a, b) => a.localeCompare(b));

    const prompt = new Select({
        name: 'selectProfile',
        message: 'Select a profile',
        choices: [...profiles, 'Back'],
    });

    const choice = await prompt.run();

    if (choice === 'Back') return manageProfilesMenu();

    profile = choice;

    return choice;
};

const setSchedule = async () => {
    console.log('Setting a schedule...');

    return updateProfileMenu();
};

const setBreakTime = async () => {
    console.log('Setting a break time...');

    return updateProfileMenu();
};

const renameProfile = async () => {
    const prompt = new Input({ message: 'Enter the new profile name', initial: profile });
    const newProfile = await prompt.run();

    config.profiles = config.profiles.map((p) => {
        if (p.name === profile) {
            return { ...p, name: newProfile };
        }

        return p;
    });

    config.blocklist = config.blocklist.map((b) => {
        if (b.profile === profile) {
            return { ...b, profile: newProfile };
        }

        return b;
    });

    config.whitelist = config.whitelist.map((w) => {
        if (w.profile === profile) {
            return { ...w, profile: newProfile };
        }

        return w;
    });

    await editConfig(config);

    profile = newProfile;

    return updateProfileMenu();
};

// eslint-disable-next-line complexity
const updateProfileMenu = async () => {
    const blocklist = config.blocklist.filter((d) => d.profile === profile);
    const whitelist = config.whitelist.filter((d) => d.profile === profile);
    const currentProfile = config.profiles.find((p) => p.name === profile);
    const enabled = currentProfile?.enabled || false;

    const prompt = new Select({
        name: 'updateProfileAction',
        message: `Update profile: ${profile}`,
        choices: [
            'Block a distraction',
            ...(blocklist.length > 0 ? ['Unblock a distraction'] : []),
            'Whitelist a distraction',
            ...(whitelist.length > 0 ? ['Unwhitelist a distraction'] : []),
            'Set a schedule',
            'Set a break time',
            'Rename profile',
            enabled ? 'Disable profile' : 'Enable profile',
            'Back',
        ],
    });

    const choice = await prompt.run();

    if (choice === 'Back') await manageProfilesMenu();
    if (choice === 'Rename profile') await renameProfile();
    if (choice === 'Enable profile') await enableProfileMenu();
    if (choice === 'Disable profile') await disableProfileMenu();
    if (choice === 'Block a distraction') await blockDistractionMenu();
    if (choice === 'Unblock a distraction') await unblockDistractionMenu();
    if (choice === 'Whitelist a distraction') await whitelistDistractionMenu();
    if (choice === 'Unwhitelist a distraction') await unwhitelistDistractionMenu();
    if (choice === 'Set a schedule') await setSchedule();
    if (choice === 'Set a break time') await setBreakTime();

    return true;
};

const createProfile = async () => {
    const profiles = config.profiles.map((p) => p.name);

    const prompt = new Input({ message: 'Enter the profile name', initial: 'Default' });
    profile = await prompt.run();

    if (profiles.includes(profile)) {
        console.log('Profile already exists');
        return mainMenu();
    }

    config.profiles.push({ name: profile, enabled: true });
    await editConfig(config);

    return updateProfileMenu();
};

const deleteProfile = async () => {
    const profiles = config.profiles.map((p) => p.name);

    const prompt = new Select({
        name: 'deleteProfile',
        message: 'Delete a profile',
        choices: [...profiles, 'Back'],
    });

    const choice = await prompt.run();

    if (choice === 'Back') return manageProfilesMenu();

    config.profiles = config.profiles.filter((p) => p.name !== choice);
    config.blocklist = config.blocklist.filter((d) => d.profile !== choice);
    config.whitelist = config.whitelist.filter((d) => d.profile !== choice);
    await editConfig(config);

    return manageProfilesMenu();
};

const manageProfilesMenu = async () => {
    const profiles = config.profiles.map((p) => p.name);

    const prompt = new Select({
        name: 'manageProfiles',
        message: 'Manage profiles',
        choices: [
            ...(profiles.length > 0 ? ['Update a profile', 'Create a profile', 'Delete a profile'] : ['Create a profile']),
            'Back',
        ],
    });

    const choice = await prompt.run();

    if (choice === 'Back') return mainMenu();
    if (choice === 'Create a profile') return createProfile();
    if (choice === 'Delete a profile') return deleteProfile();
    if (choice === 'Update a profile') {
        profile = await selectProfile();
        return updateProfileMenu();
    }

    return true;
};

const enableShieldMode = async () => {
    config.shield = true;

    return mainMenu();
};

const disableShieldMode = async () => {
    config.shield = false;

    return mainMenu();
};

const takeBreak = async () => {
    console.log('Taking a break...');

    return mainMenu();
};

const mainMenu = async () => {
    const prompt = new Select({
        name: 'mainMenu',
        message: 'Choose an option',
        choices: [
            'Manage profiles',
            config.shield ? 'Disable shield mode' : 'Enable shield mode',
            'Take a break',
            'Quit',
        ],
    });

    const choice = await prompt.run();

    if (choice === 'Manage profiles') return manageProfilesMenu();
    if (choice === 'Enable shield mode') return enableShieldMode();
    if (choice === 'Disable shield mode') return disableShieldMode();
    if (choice === 'Take a break') return takeBreak();

    return true;
};

export default mainMenu;
