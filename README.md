# Ulysse

## 📋 Requirements

- Linux
- Node.js >= 14.0.0

## ✨ Features

- [ ] Block your distracting apps
- [ ] Block your distracting websites
- [ ] Shield mode (no way to bypass)
- [ ] Webhook support (for n8n, Zapier, IFTTT, etc...)
- [ ] Linux support
- [ ] Windows support
- [ ] macOS support
- [ ] Android support

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
                             'ulysse -b example.com -t 30m/day' (block with a daily limit)
                             'ulysse -b MyAppName -t 10am-6pm' (block during specific hours)
                             'ulysse -b example.com -t 10m' (block for a short duration)
                             'ulysse -b example.com/path' (block a specific path)
                             'ulysse -b "*.*"' (block all websites)

  -u, --unblock TARGET     Unblock a specific website or application.
                           Example: 'ulysse -u example.com' or 'ulysse -u MyAppName'.

  -w, --whitelist          Whitelist a specific website.
                           Example: 'ulysse -w example.com'.

  -s, --shield             Enable shield mode to prevent jailbreak.
                           Example: 'ulysse -s' or 'ulysse --shield'.

  -d, --daemon             Run Ulysse as a daemon.
                           Example: 'ulysse -d' or 'ulysse --daemon'.

  -l, --list               List all currently blocked websites and apps.

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
