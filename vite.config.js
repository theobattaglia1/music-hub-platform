import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableDevtools = env.ENABLE_VUE_DEVTOOLS === "1";

  let devtoolsPlugin = null;
  if (enableDevtools) {
    try {
      devtoolsPlugin = (await import("vite-plugin-vue-devtools")).default;
    } catch {
      devtoolsPlugin = null;
    }
  }

  return {
    plugins: [vue(), ...(devtoolsPlugin ? [devtoolsPlugin()] : [])],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    preview: {
      allowedHosts: ["music-hub-platform.onrender.com", "allmyfriendsinc.com"],
    },
  };
});
