const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');

module.exports = function loadModule(file, mocks = {}, overrides = {}) {
  const filename = path.resolve(__dirname, '../..', file);
  const realRequire = createRequire(filename);
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : realRequire(name),
    __filename: filename, __dirname: path.dirname(filename), Buffer, URL, Date,
    setTimeout, clearTimeout, process: { env: {} }, global: { settingJSON: {} },
    console: { log() {}, error() {}, warn() {} }, ...overrides,
  });
  new vm.Script(fs.readFileSync(filename, 'utf8'), { filename }).runInContext(context);
  return module.exports;
};
