/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_BETTER_AUTH_URL: string;
  readonly SECRET_BETTER_AUTH: string;
  readonly PUBLIC_TURSO_DATABASE_URL: string;
  readonly SECRET_TURSO_AUTH_TOKEN: string;

  readonly SECRET_ADMIN_EMAILS: string;
  readonly PUBLIC_GOOGLE_CLIENT_ID: string;
  readonly SECRET_GOOGLE_CLIENT: string;

  readonly S3_URL: string;
  readonly S3_BUCKET_NAME: string;
  readonly S3_ACCESS_KEY: string;
  readonly S3_SECRET_ACCESS_KEY: string;
  readonly S3_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    session: import("./lib/auth").Session | null;
    user: import("./lib/auth").User | null;
  }
}
