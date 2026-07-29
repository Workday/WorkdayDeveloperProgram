// Loads every entry's example.json straight from the catalog and examples
// folders, so the site always reflects what is merged. No manifest step.

import hub from "../../../hub.config.json";

const catalogModules = import.meta.glob("../../../catalog/*/example.json", { eager: true });
const exampleModules = import.meta.glob("../../../examples/*/example.json", { eager: true });

export const config = hub;

function load(modules, dir, section, defaultSource) {
  return Object.entries(modules)
    .map(([path, mod]) => {
      const id = path.split("/").at(-2);
      const meta = mod.default ?? mod;
      return {
        id,
        section,
        path: `${dir}/${id}`,
        tutorial: "",
        authors: [],
        components: [],
        products: [],
        source: defaultSource,
        ...meta
      };
    })
    .filter((entry) => !entry.id.startsWith("_"));
}

export const examples = [
  ...load(catalogModules, "catalog", "App catalog", "workday"),
  ...load(exampleModules, "examples", "Examples", "community")
].sort((a, b) => a.title.localeCompare(b.title));

export const sourceLabel = (example) => (example.source === "workday" ? "Workday" : "Community");

export const sections = [...new Set(examples.map((example) => example.section))].sort();
export const types = [...new Set(examples.map((example) => example.type))].filter(Boolean).sort();
export const componentsInUse = [...new Set(examples.flatMap((example) => example.components))].sort();
export const productsInUse = [...new Set(examples.flatMap((example) => example.products))].sort();
export const sourcesInUse = [...new Set(examples.map(sourceLabel))].sort();

const BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + "/";

export function withBase(path = "") {
  return BASE + path.replace(/^\//, "");
}
