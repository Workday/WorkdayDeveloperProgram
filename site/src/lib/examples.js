// Loads every example's example.json straight from the examples folder,
// so the site always reflects what is merged. No manifest step needed.

import hub from "../../../hub.config.json";

const modules = import.meta.glob("../../../examples/*/example.json", { eager: true });

export const config = hub;

export const examples = Object.entries(modules)
  .map(([path, mod]) => {
    const id = path.split("/").at(-2);
    const meta = mod.default ?? mod;
    return { id, path: `examples/${id}`, tutorial: "", authors: [], components: [], products: [], ...meta };
  })
  .filter((example) => !example.id.startsWith("_"))
  .sort((a, b) => a.title.localeCompare(b.title));

export const types = [...new Set(examples.map((example) => example.type))].filter(Boolean).sort();
export const componentsInUse = [...new Set(examples.flatMap((example) => example.components))].sort();
export const productsInUse = [...new Set(examples.flatMap((example) => example.products))].sort();

const BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + "/";

export function withBase(path = "") {
  return BASE + path.replace(/^\//, "");
}
