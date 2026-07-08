// Shared lint config for the packages/ workspaces; apps/web has its own
// Next.js config that takes precedence inside that directory.
import tseslint from "typescript-eslint";

export default tseslint.config(...tseslint.configs.recommended, {
  ignores: ["**/node_modules/**", "**/.turbo/**", "**/dist/**"],
});
