// Name: Browse Directories
// Description: Navigate Directories and Take Actions
// Cache: true
// Trigger: /

import type { PathDefaultMissingValues } from "../types/kit.js"

import { actionFlags } from "./common.js"

let flags = {}
for (let flag of actionFlags) {
  flags[flag.name] = flag
}

let initialPath = args?.shift() || home()
if (initialPath === "~") {
  initialPath = home()
}

// Path normalization is now handled inside the path utility
let selectedPath = await path({
  flags,
  startPath: initialPath,
  resize: true,
  enter: "Actions",
  onMenuToggle: (input, state) => {
    if (state.flag) {
      setPlaceholder("Select Action")
      setEnter("Submit")
    } else {
      setPlaceholder("Browse")
      setEnter("Actions")
    }
  },
  onSubmit: async (input, state) => {
    // await editor(JSON.stringify({input, state}, null, 2));
    if (state?.focused?.asTyped && state?.focused?.value === 'select-anyway') {
      setFlagValue({
        name: path.parse(input).base,
        value: input
      });
      return preventSubmit;
    }
    if (state?.focused?.miss) {
      let selectedPath = input;
      let doesPathExist = await pathExists(selectedPath);
      let type = "file";
      if (!doesPathExist) {
        const value = state?.focused
          ?.value;
        if (value === "create-file") {
          await ensureFile(selectedPath);
        }
        if (value === "create-folder") {
          type = "folder";
          await ensureDir(selectedPath);
        }
      }
      let pathChoice = {
        img: kitPath("icons", `${type}.svg`),
        name: path.parse(selectedPath).base,
        value: selectedPath,
      };
      setChoices([pathChoice]);
      setFlagValue(pathChoice);
      return preventSubmit;
    }
    if (!state?.flag) {
      await setFlagValue(state?.focused);
      return preventSubmit;
    }
  },
})

await actionFlags
  .find(f => flag?.[f.name])
  ?.action?.(selectedPath)
