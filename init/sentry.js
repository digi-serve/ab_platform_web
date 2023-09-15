import * as Sentry from "@sentry/browser";
Sentry.init({
   dsn: "https://c16443e39a66eae141954dfd23890812@o144358.ingest.sentry.io/4505832903147520",
   environment: WEBPACK_MODE,
   /* global WEBPACK_MODE - This is set by the DefinePlugin in webpack. */

   //    release: "my-project-name@2.3.12",
   integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
   normalizeDepth: 5,
   tracesSampleRate: 0.1,
   replaysSessionSampleRate: 0,
   replaysOnErrorSampleRate: 0,
});
