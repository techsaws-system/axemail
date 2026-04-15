import path from "node:path";
import Module from "node:module";

type NodeModuleAlias = typeof Module & {
  _resolveFilename: (
    request: string,
    parent?: unknown,
    isMain?: boolean,
    options?: unknown,
  ) => string;
};

const moduleWithAlias = Module as NodeModuleAlias;
const originalResolveFilename = moduleWithAlias._resolveFilename;

if (!(globalThis as { __axemailAliasInstalled?: boolean }).__axemailAliasInstalled) {
  moduleWithAlias._resolveFilename = function resolveFilename(
    request: string,
    parent?: unknown,
    isMain?: boolean,
    options?: unknown,
  ) {
    if (request.startsWith("@/")) {
      const absoluteRequest = path.join(__dirname, "..", request.slice(2));
      return originalResolveFilename.call(this, absoluteRequest, parent, isMain, options);
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  (globalThis as { __axemailAliasInstalled?: boolean }).__axemailAliasInstalled = true;
}

export {};
