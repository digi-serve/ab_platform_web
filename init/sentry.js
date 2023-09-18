import * as Sentry from "@sentry/browser";
let webpackMode = "develop";
let version;
try {
   webpackMode = WEBPACK_MODE;
   /* global WEBPACK_MODE */
   /* This is set by the DefinePlugin in webpack. */
   version = VERSION;
   /* global VERSION */
   /* Version from package.json. Set by the DefinePlugin in webpack. */
} catch (err) {
   console.warn(
      "WEBPACK_MODE or VERSION variable not found, falling back to develop"
   );
}
Sentry.init({
   dsn: "https://c16443e39a66eae141954dfd23890812@o144358.ingest.sentry.io/4505832903147520",
   environment: webpackMode,
   release: version,
   integrations: [new Sentry.BrowserTracing()],
   normalizeDepth: 5,
   sampleRate: 0.1,
   tracesSampleRate: 0.1,
});
