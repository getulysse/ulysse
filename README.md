## Add a service

```txt
[Unit]
Description=Ulysse
After=network.target

[Service]
ExecStart=/usr/bin/node index.mjs --daemonize --config /home/johackim/.config/ulysse/config.json
Restart=always
User=root
Group=root
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/home/johackim/Dev/ulysse

[Install]
WantedBy=multi-user.target
```
