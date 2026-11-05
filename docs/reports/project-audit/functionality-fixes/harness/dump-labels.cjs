"use strict";
const { L, session, labels } = require("./lib.cjs");
(async () => {
  const app = await session({ width: 390, height: 844, mobile: true, tag: "dump" });
  const n = await L.nodes(app.page);
  console.log(JSON.stringify(n.filter((x) => x.label).map((x) => [x.label.slice(0, 30), x.role, Math.round(x.x), Math.round(x.y)])));
  await app.close(); process.exit(0);
})();
