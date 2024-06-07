# Ulysse

[![Version](https://img.shields.io/npm/v/ulysse?label=Version&style=flat&colorA=2B323B&colorB=1e2329)](https://www.npmjs.com/package/ulysse)
[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?label=License&style=flat&colorA=2B323B&colorB=1e2329)](https://raw.githubusercontent.com/johackim/ulysse/master/LICENSE.txt)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/johackim/ulysse.svg?label=Maintainability&style=flat&colorA=2B323B&colorB=1e2329)](https://codeclimate.com/github/johackim/ulysse)

Ulysse is a simple CLI tool for blocking your distracting apps and websites.

Prevent distractions by blocking your most distracting apps and websites, even if you are the administrator of your computer.

> [!WARNING]
> The shield mode block root access to your computer and can block you from disabling Ulysse.
>
> Make sure to remember your password.
>
> If you are blocked, you can still disable Ulysse by running the following commands from a live USB:
>
> ```bash
> rm /etc/sudoers.d/ulysse
> usermod -s /bin/bash root # Or edit /etc/passwd file
> echo 'nameserver 9.9.9.9' | sudo tee /etc/resolv.conf
> ```

## 📋 Requirements

- Linux
- Node.js >= 14.0.0

## ✨ Features

- [x] Block your distracting apps and websites
- [x] Shield mode (no way to bypass)

## 📦 Installation

```bash
npm i -g ulysse
```

## 📖 Usage

```txt
Usage: ulysse [OPTIONS]

  Ulysse: A simple and powerful tool to block your distracting apps and websites.

Options:
  -b, --block TARGET [-t, --time VALUE]
                           Block a specific website or application. Optionally, add a time-based setting.
                           The VALUE format can include usage limits, specific time intervals,
                           or a quick block duration.
                           Examples: 
                             'ulysse -b example.com' (block indefinitely)
                             'ulysse -b example.com -t 10m' (block for a short duration)
                             'ulysse -b MyAppName -t 10h-18h' (block during specific hours)

  -u, --unblock TARGET     Unblock a specific website or application.
                           Example: 'ulysse -u example.com' or 'ulysse -u MyAppName'.

  -w, --whitelist TARGET   Whitelist a specific website.
                           Example: 'ulysse -w example.com'.

  -s, --shield [on|off] [-p, --password VALUE]
                           Enable or disable shield mode to prevent jailbreak.
                           By default, the shield mode is on. Use 'off' along with a password to disable it.
                           The password is required to disable the shield mode.
                           Example: 'ulysse -s on' to enable or 'ulysse -s off -p myp@ssw0rd' to disable.

  -d, --daemon             Run Ulysse as a daemon.
                           Example: 'ulysse -d' or 'ulysse --daemon'.

  -v, --version            Show the version and exit.

  -h, --help               Show this message and exit.
```

## 🎁 Support me

Please support me with a one-time or a monthly donation and help me continue my activities.

[![Github sponsor](https://img.shields.io/badge/github-Support%20my%20work-lightgrey?style=social&logo=github)](https://github.com/sponsors/johackim/)
[![ko-fi](https://img.shields.io/badge/ko--fi-Support%20my%20work-lightgrey?style=social&logo=ko-fi)](https://ko-fi.com/johackim)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-Support%20my%20work-lightgrey?style=social&logo=buy%20me%20a%20coffee&logoColor=%23FFDD00)](https://www.buymeacoffee.com/johackim)
[![liberapay](https://img.shields.io/badge/liberapay-Support%20my%20work-lightgrey?style=social&logo=liberapay&logoColor=%23F6C915)](https://liberapay.com/johackim/donate)
[![Github](https://img.shields.io/github/followers/johackim?label=Follow%20me&style=social)](https://github.com/johackim)
[![Mastodon](https://img.shields.io/mastodon/follow/1631?domain=https%3A%2F%2Fmastodon.ethibox.fr&style=social)](https://mastodon.ethibox.fr/@johackim)
[![Twitter](https://img.shields.io/twitter/follow/_johackim?style=social)](https://twitter.com/_johackim)

## 📜 License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/johackim/ulysse/master/LICENSE.txt) file for details

**Free Software, Hell Yeah!**
