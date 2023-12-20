/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser, context) => {
   // launch browser for LHCI
   const page = await browser.newPage();
   await page.goto("http://localhost");
   await page.type(
      '[data-cy="portal_auth_login_form_email"]',
      "admin@email.com"
   );
   await page.type('[data-cy="portal_auth_login_form_password"]', "admin");
   await page.click('[data-cy="portal_auth_login_form_submit"]');
   await page.waitForNavigation();
   // close session for next run
   await page.close();
};
