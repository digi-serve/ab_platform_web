import * as Sentry from "@sentry/browser";

Sentry.init({
   dsn: "https://c16443e39a66eae141954dfd23890812@o144358.ingest.sentry.io/4505832903147520",

   // Alternatively, use `process.env.npm_package_version` for a dynamic release version
   // if your build tool supports it.
   //    release: "my-project-name@2.3.12",
   integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
   normalizeDepth: 5,

   // Set tracesSampleRate to 1.0 to capture 100%
   // of transactions for performance monitoring.
   // We recommend adjusting this value in production
   tracesSampleRate: 0.1,

   // Capture Replay for 10% of all sessions,
   // plus for 100% of sessions with an error
   replaysSessionSampleRate: 0,
   replaysOnErrorSampleRate: 0.1,
});
