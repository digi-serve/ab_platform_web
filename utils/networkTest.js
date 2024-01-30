/**
 * Determines if the connection speed is slow, so we can notify users.
 * This is meant to be used as webworker so as to not clog the main thread.
 * Will post a message with true/false for whether the connection is slow.
 */

const threshold = 350; //ms
// This is supported in chrome, but not firefox, safari, etc.
// see: https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API#browser_compatibility
const networkInfo = self.navigator?.connection;
if (networkInfo) {
   const slow = networkInfo.rtt > threshold;
   self.postMessage(slow);
   networkInfo.onchange = () => {
      self.postMessage(networkInfo.rtt > threshold);
   };
} else {
   // For browsers without the Network Information API calculate manually from
   // image download. Based on isFastNet, modified to work in a Worker.
   // https://github.com/Saunved/isfastnet/blob/b64d7cb43115b0e7f5c9fa91d0305bb8e95e68f2/isfastnet.js
   const runTest = () =>
      testLatency("https://www.google.com/images/phd/px.gif", 5, (avg) => {
         self.postMessage(avg > threshold);
      });
   runTest();
   // Recheck the speed every 30s
   setInterval(runTest, 30000);
}

/**
 * recursively download a resource and track the average time to download.
 * @param {string} resource path to request the resource
 * @param {number} [timesToTest=5] how many times to run the test
 * @param {funcion} callback called with the average time in ms (avg) => {}
 */
function testLatency(resource, timesToTest = 5, cb, _results = []) {
   // Exit early - if the current response takes significantly longer than our
   // threshold, no need to finish all the tests.
   setTimeout(() => {
      timesToTest = 0;
   }, threshold * 3);
   if (timesToTest > 0) {
      const start = performance.now();
      fetch(resource, {
         mode: "no-cors",
         cache: "no-store",
      })
         .then(() => {
            const end = performance.now();
            _results.push(end - start);
            testLatency(resource, timesToTest - 1, cb, _results);
         })
         .catch(() => cb(10 * threshold)); // <- fetch failed, return a high number
   } else {
      /** calculate average of array items then callback */
      const sum = _results.reduce((a, b) => a + b);
      const avg = sum / _results.length;
      cb(avg);
   }
}
