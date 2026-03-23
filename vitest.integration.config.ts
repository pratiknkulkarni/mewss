import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.integration.test.ts"],
        globalSetup: "./src/test/setup.ts",
        environment: "node",
        reporters: ["verbose"],
        pool: "forks",
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
});