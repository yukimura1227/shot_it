const fs = require("fs");
const parseJSON = require('json-parse-async');
const puppeteer = require('puppeteer');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const electron = require("electron");
const {app} = electron;

const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const custom = require(app.getPath('userData') + '/custom.js');

async function take_screen_shot(url, filename) {
  const page = await global.browser.newPage();
  page.setViewport({width: 1200, height: 800})

  await page.goto(url);
  await page.waitForNavigation({waitUntil:'networkidle2', timeout: 30000})
            .catch(e => console.log('timeout exceed. proceed to next operation'))
  return page.screenshot({path: global.result_dir + '/' + filename, fullPage: true});
};

async function diff(filename) {
  var result_file_path = global.result_dir + '/' + filename;
  var origin_file_path = app.getPath('userData') + '/origin/' + filename;
  if(!fs.existsSync(result_file_path) || !fs.existsSync(origin_file_path)) {
    return;// new Promise((resolve, reject) => {resolve();});
  }
  var img1 = await PNG.sync.read(fs.readFileSync(result_file_path));
  var img2 = await PNG.sync.read(fs.readFileSync(origin_file_path));
  var diff = await new PNG({width: img1.width, height: img1.height});
  await pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});
  return diff.pack().pipe(fs.createWriteStream(app.getPath('userData') + '/diff/' + filename));
}

module.exports.take_all_screen_shot = take_all_screen_shot;
function take_all_screen_shot() {
  (async () => {
    const revision = require('puppeteer/package.json').puppeteer.chromium_revision
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download(revision);
    var args = ''
    if(browserFetcher.platform() == 'linux') {
      args = ['--no-sandbox']
    }
    var date = new Date();
    global.result_dir = app.getPath('userData') + '/test_result/' + date.getTime();
    fs.mkdirSync(global.result_dir);
    global.browser = await puppeteer.launch({executablePath: revisionInfo.executablePath, args: args});
    if(typeof custom.before_screen_shot == 'function'){
      await custom.before_screen_shot(browser );
    }

    parseJSON(fs.readFileSync(app.getPath('userData') + '/url_list.json', 'utf8'))
      .then(async (content) => {
        var url_info_list = content.url_info_list

        await Promise.all( url_info_list.map(async (url_info) => {
          if(url_info.filename == undefined) {
            var filename = url_info.url.replace(/[:,\/\.]/g, '_') + '.png'
          } else {
            var filename = url_info.filename
          }
          await take_screen_shot(url_info.url, filename);
        }));

        await global.browser.close();

        await imagemin([global.result_dir+ '/*.png'], global.result_dir + '/', {
          plugins: [
            imageminPngquant()
          ]
        });

        await Promise.all( url_info_list.map(async (url_info) => {
          diff(url_info.filename);
        }));

        console.log('all done');
      })
      .catch(function (err) {
         console.log('promise was rejected:', err);
      });
  })();
}
