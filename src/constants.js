export const DEFAULT_CONFIG = process.env.DEFAULT_CONFIG || { shield: { enable: false }, blocklist: [], whitelist: [], date: new Date('1970').toISOString() };

export const RESOLV_CONF_PATH = process.env.RESOLV_CONF_PATH || '/etc/resolv.conf';

export const CONFIG_PATH = process.env.CONFIG_PATH || '/etc/ulysse/config.json';

export const SOCKET_PATH = process.env.SOCKET_PATH || '/var/run/ulysse.sock';

export const DNS_SERVER = process.env.DNS_SERVER || '9.9.9.9';

export const DNS_PORT = process.env.DNS_PORT || 53;

export const DOMAIN_REGEX = /^([\w-]+\.)+[\w-]+$/;
