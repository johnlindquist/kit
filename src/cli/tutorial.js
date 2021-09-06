"use strict";
// Description: A tutorial to introduce concepts of Simple Scripts
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
exports.name = await arg(`Let's create a script that creates a file from your GitHub profile data. 
  Please name your script (example: get-profile):`);
await cli("new", exports.name, "--template", "tutorial");
echo(chalk `\n🤯 {yellow.italic Type} {green.bold ${exports.name}} {yellow.italic in any directory to run ${exports.name}.js}" 🤯\n`);
