export interface ConfigModuleOptions {
  /** Path(s) to .env file(s). Defaults to `.env` in the working directory. */
  envFilePath?: string | string[]
  /** When true, skips loading any .env file and reads only from `process.env`. */
  ignoreEnvFile?: boolean
}
