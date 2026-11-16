# Etfruit E-commerce

## Requirements

- Bun
- PostgreSQL
- MongoDB (the Express application still uses MongoDB through Mongoose)

## Local setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy the environment template and update the database URLs and other local settings:

   ```bash
   cp -n .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string. Its format is:

   ```text
   postgresql://USER:PASSWORD@HOST:5432/etfruit?schema=public
   ```

   URL-encode special characters in the username or password. Set `MONGO_URI` as
   well if you plan to run the existing Express application.

3. Ensure the `etfruit` PostgreSQL database exists, then validate the Prisma
   schema and generate the client:

   ```bash
   bun run db:validate
   bun run db:generate
   ```

4. For a local prototype, synchronize the schema with PostgreSQL:

   ```bash
   bun run db:push
   ```

   For changes that should be tracked and deployed, use versioned migrations:

   ```bash
   bun run db:migrate
   ```

   Apply committed migrations in a deployment environment with
   `bun run db:migrate:deploy`.

5. Open Prisma Studio to inspect the PostgreSQL database:

   ```bash
   bun run db:studio
   ```

## Important

Prisma/PostgreSQL is configured alongside the existing app. The current server
and data models still use MongoDB/Mongoose; adding Prisma does not migrate those
models or switch the running application to PostgreSQL.
