import { tree } from "tree-node-cli";
import fs from "node:fs";

const treeString = tree("../", {
  allFiles: true,
  exclude: [/node_modules/, /dist/, /\.git/],
});

fs.writeFileSync("project-tree.txt", treeString, "utf-8");

console.log("Дерево сохранено в project-tree.txt");
