import os from 'os';

export const DEFAULT_CONFIG_FOLDER_PATH = `/home/${process.env.SUDO_USER || os.userInfo().username}/.config/ulysse`;

export const DEFAULT_CONFIG_PATH = `${DEFAULT_CONFIG_FOLDER_PATH}/${process.env.NODE_ENV === 'test' ? 'test' : 'config'}.json`;

export const DEFAULT_CONFIG = {
    shield: false,
    blocklist: [],
    whitelist: [],
};

export const PIPE_PATH = `${DEFAULT_CONFIG_FOLDER_PATH}/pipe.json`;

export const DNS_SERVER = process.env.DNS_SERVER || '9.9.9.9';

export const DNS_PORT = process.env.DNS_PORT || 53;
