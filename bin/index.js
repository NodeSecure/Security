#!/usr/bin/env node

// Import Node.js Dependencies
import fs from "fs";

// Import Third-party Dependencies
import sade from "sade";
import kleur from "kleur";

// Import internal dependencies
import * as nreport from "../index.js";
import { createConfigFile, isValidConfiguration } from "./config.js";

// Constants
const version = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url))
);

// Process scripts args
const prog = sade("nodesecure/report").version(version);

async function runNodesecureReport() {
  console.log(kleur.grey().bold(`\n > Nreport starting at: ${kleur.yellow().bold(process.cwd())}\n`));

  try {
    isValidConfiguration();
    await nreport.main();
  }
  catch (err) {
    console.error(err);
  }
}

async function createConfig() {
  console.log(kleur.grey().bold(`\n > Nreport create a default configuration file at: ${kleur.yellow().bold(process.cwd())}\n`));

  try {
    await createConfigFile();
  }
  catch (err) {
    console.error(err);
  }
}

prog
  .command("run")
  .describe("Run nodesecure/report")
  .example("nreport run")
  .action(runNodesecureReport);

prog
  .command("generate-config")
  .describe("Create nodesecure/report configuration file")
  .example("nreport config")
  .action(createConfig);

prog.parse(process.argv);
