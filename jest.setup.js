const fs = require('fs');
const { CONFIG_PATH } = require('./src/constants');
const { socket } = require('./src/socket');

module.exports = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
    }

    socket();
};
