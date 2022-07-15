import { writeFileSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import {} from "path/posix";

const writeJson = (filePath: string, jsonData: any) => {
  try {
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    throw new Error(`Error writing entrypoints.json ${err.message}`);
  }
};

const emptyDir = (dir: string) => {
  const files = readdirSync(dir);
  for (const file of files) {
    rmSync(join(dir, file), { recursive: true });
  }
};

export { writeJson, emptyDir };
