import { defineConfig } from "vitest/config";
export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["src/**/*.integration.test.ts", "node_modules"],
        environment: "node",
        reporters: ["verbose"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: [
                "src/**/*.test.ts",
                "src/**/*.integration.test.ts",
                "src/db/generated/**",
                "src/index.ts",
            ],
        },
    },
});
