import {Client} from "pg";
import {readdir, readFile} from "fs/promises";
import path from "path";
import {PostgreSqlContainer} from "@testcontainers/postgresql";

let container: Awaited<ReturnType<InstanceType<typeof PostgreSqlContainer>["start"]>>;

export async function setup() {
    container = await new PostgreSqlContainer("postgres:15")
        .withDatabase("mewss_test")
        .withUsername("test")
        .withPassword("test")
        .start();

    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;

    await runMigrations(connectionString);
}

export async function teardown() {
    await container?.stop();
}

async function runMigrations(connectionString: string) {
    const client = new Client({connectionString});
    await client.connect();

    try {
        // const migrationsDir = path.join(
        //     __dirname,
        //     "../../../feedscheduler/internal/database/migrations"
        // );

        const migrationsDir = path.join(__dirname, "./migrations");
        // console.log(migrationsDir);

        const files = await readdir(migrationsDir);

        const upFiles = files
            .filter((f) => f.endsWith(".up.sql"))
            .sort();

        for (const file of upFiles) {
            const sql = await readFile(path.join(migrationsDir, file), "utf-8");
            await client.query(sql);
        }
    } finally {
        await client.end();
    }
}