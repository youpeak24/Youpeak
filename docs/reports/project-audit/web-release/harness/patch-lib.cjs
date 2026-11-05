// Tiny EOL-preserving search/replace used while applying the fixes.
const fs = require('fs');
module.exports = function patch(file, pairs) {
  let raw = fs.readFileSync(file, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = crlf ? raw.replace(/\r\n/g, '\n') : raw;
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`${file}: text not found:\n${from.slice(0, 160)}`);
    s = s.replace(from, () => to);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
};
