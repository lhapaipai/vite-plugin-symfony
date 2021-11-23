import { writeFileSync } from "fs";

const writeJson = (filePath: string, jsonData: EntryPointsFile) => {
  try {
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    throw new Error(`Error writing entrypoints.json ${err.message}`);
  }
};

export { writeJson };
