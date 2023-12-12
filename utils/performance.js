/**
 * Performance - utility to track performance of the web platform
 * Written initally for sentry, but could be extended to support others
 * tracking tools.
 * Also can supports the User timing API for lighthouse / local dev
 */

import * as Sentry from "@sentry/browser";

/* These come form the DefinePlugin in webpack  */
let webpackMode = "development";
let version, dsn;
try {
   /* global WEBPACK_MODE SENTRY_DSN VERSION */
   webpackMode = WEBPACK_MODE;
   dsn = SENTRY_DSN;
   version = VERSION;
} catch (err) {
   console.warn(
      "Error reading from webpack, check the DefinePlugin is working correctly",
      err
   );
}

const mode = dsn
   ? "sentry"
   : webpackMode === "development"
   ? "browser"
   : undefined;

// Following are performance tracking sources, will be accessed through the
// PerfomanceInterface

/*
 * Default - performance tracking disabled
 */
class Performance {
   init() {}
   error() {}
   mark() {}
   measure() {}
   setContext() {}
}

/*
 * Sentry perfomance tracking
 */
class SentryPerformance extends Performance {
   constructor() {
      super();
      this.childSpans = {};
   }

   init() {
      Sentry.init({
         dsn,
         environment: webpackMode,
         release: version,
         integrations: [new Sentry.BrowserTracing()],
         normalizeDepth: 5,
         sampleRate: 0.05,
         tracesSampleRate: 0.05,
      });
   }

   error(err) {
      Sentry.captureException(err);
   }

   mark(key, context) {
      context.name = key;
      if (!this.mainSpan) {
         this.mainSpanKey = key;
         this.mainSpan = Sentry.startTransaction(context);
      } else {
         this.childSpans[key] = this.mainSpan.startChild(context);
      }
   }

   measure(key) {
      if (this.mainSpanKey === key) {
         this.mainSpan.finish();
         delete this.mainSpan;
         delete this.mainSpanKey;
         delete this.childSpans;
      } else {
         this.childSpans[key]?.finish?.();
         delete this.childSpans[key];
      }
   }

   setContext(key, data) {
      switch (key) {
         case "tags":
            Sentry.setTags(data);
            break;
         case "user":
            Sentry.setUser(data);
            break;
         default:
            Sentry.setContext(key, data);
            break;
      }
   }
}

/*
 * Browser Performance tracking - uses the Performance API
 */
class BrowserPerformnace extends Performance {
   error(err) {
      console.error(err);
   }

   mark(key, context) {
      if (!this.mainSpanKey) {
         this.mainSpanKey = key;
      }
      window.performance.mark(key, { detail: context });
   }

   measure(key) {
      try {
         const mark = window.performance.getEntriesByName(key, "mark")[0];
         const measure = window.performance.measure(key, {
            start: key,
            detail: mark.detail,
         });
         if (this.mainSpanKey === key) {
            console.log(`${measure.name} finished in ${measure.duration} ms`);
            console.table(window.performance.getEntriesByType("measure"), [
               "name",
               "duration",
               "startTime",
            ]);
            delete this.mainSpanKey;
            window.performance.clearMarks();
            window.performance.clearMeasures();
         }
      } catch (e) {
         console.warn(e);
      }
   }
}

/**
 * hash of performance tracking sources
 */
const sources = {
   sentry: SentryPerformance,
   browser: BrowserPerformnace,
};

/**
 * Performance Interface that the rest of the app uses. Routes the calls to the
 * configured performance tracking source
 */
class PerformanceInterface {
   constructor(mode) {
      this.mode = mode;
      this.initialized = false;
      this._source = new (sources[mode] ?? Performance)();
   }

   /**
    * initialize performance, should be called early in init
    */
   init() {
      if (this.initialized) return;
      this._source.init();
      console.log("Performance.init() complete", mode);
      this.initialized = true;
   }

   /**
    * Capture an error
    * @param {Error} error
    */
   error(err) {
      this._source.error(err);
   }

   /**
    * Start a performance tracking span. End by calling measure() with the same key.
    * The first mark will be consider a parent, and subsequent marks become
    * children until the initial mark is measured.
    * @param {string} key unique key to track
    * @param {object} [context] any additional context
    */
   mark(key, context) {
      this._source.mark(key, context);
   }

   /**
    * End a performance tracking span
    * @param {string} key should match an existing mark
    */
   measure(key) {
      this._source.measure(key);
   }

   /**
    * Set additional context to tracing/error events
    * @param {string} key type of context (tag, user, etc)
    * @pram {object} data
    */
   setContext(key, data) {
      if (this.mode === "sentry") {
         switch (key) {
            case "tags":
               Sentry.setTags(data);
               break;
            case "user":
               Sentry.setUser(data);
               break;
            default:
               Sentry.setContext(key, data);
               break;
         }
      }
   }
}

// singleton
let performanceInterface;

/**
 * Get/create the shared performance instance
 * @returns {PerformanceInterface}
 */
function getPerformance() {
   if (!performanceInterface)
      performanceInterface = new PerformanceInterface(mode);
   return performanceInterface;
}

export default getPerformance();
