require('dotenv/config');
const fs = require('fs');
const { CONFIG_PATH } = require('./src/constants');

module.exports = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
    }

    import('./src/socket');
};
