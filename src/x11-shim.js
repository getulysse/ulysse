const { createRequire } = require('module');

const realRequire = createRequire(__filename);

module.exports = realRequire('x11');
