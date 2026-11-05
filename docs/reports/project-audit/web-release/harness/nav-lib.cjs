// Shared helpers for the web-release harness. puppeteer-core is resolved from
// NODE_PATH (installed in the scratchpad, not in the repo).
const path = require('path');
const web = path.resolve(__dirname, '../../web-tasking/harness/lib.cjs');
module.exports = require(web);
