module.exports.before_screen_shot = before_screen_shot;
/**
 * @param {Browser} PuppeteerのBrowserインスタンス。ref: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser
 * @return {Promise}
*/
async function before_screen_shot(browser) {
  return Promise.resolve("Dummy");
  /*
  // YAHOO!! にログインするサンプル
  const user_name = 'xxxxxx'
  const password  = 'aaaaaa'
  const page = await global.browser.newPage();
  await page.goto('https://login.yahoo.co.jp/config/login')
  await page.type('#username', user_name);
  const next_button = await page.$('#btnNext');
  await next_button.click();

  await page.type('#passwd', password);
  const submit_button = await page.$('#btnSubmit');
  return await submit_button.click();
  */
}
