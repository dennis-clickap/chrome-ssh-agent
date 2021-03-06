// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

require("chromedriver");
const {Builder, By, until, logging, Capabilities}
  = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var assert = require("assert");
var fs = require("fs");
var os = require("os");

var extensionData = fs.readFileSync(process.env.TEST_EXTENSION_CRX)
  .toString("base64");
var chromeLog = os.tmpdir() + "/chrome.log";
var chromedriverLog = os.tmpdir() + "/chromedriver.log";

function makeExtensionUrl(page) {
  var url = []
  url.push(
    "chrome-extension://",
    process.env.TEST_EXTENSION_ID,
    "/",
    page,
  );
  return url.join("");
}


function printLogs(entries) {
  var i;
  for (i = 0; i < entries.length; i++) {
    console.log(entries[i].message);
  }
}

// Show logs webdriver logs in the console.
logging.getLogger("").setLevel(logging.Level.DEBUG);
logging.installConsoleHandler();

// Send chromedriver logs to a file.
chrome.setDefaultService(new chrome.ServiceBuilder()
  .loggingTo(chromedriverLog)
  .enableVerboseLogging()
  .build());

describe('SSH Agent', function () {
  let driver
  this.timeout(30000);

  beforeEach(async function() {
    // Capture the browser's console logs.
    logPrefs = new logging.Preferences();
    logPrefs.setLevel(logging.Type.BROWSER, logging.Level.DEBUG);
    driver = await new Builder()
      .setChromeOptions(new chrome.Options()
        .addExtensions(extensionData)
        .addArguments("no-sandbox")
        .setChromeLogFile(chromeLog))
      .withCapabilities(new Capabilities().setLoggingPrefs(logPrefs))
      .forBrowser('chrome')
      .build();
  })

  it('successfully manages keys via the Options UI', async function() {
    await driver.get(makeExtensionUrl("html/options.html?test"));

    count = await driver.wait(until.elementLocated(By.id('failureCount')))
      .getText();
    failures = await driver.wait(until.elementLocated(By.id('failures')))
      .getText();
    assert.equal(parseInt(count), 0, failures);
  })

  afterEach(async function() {
    if (this.currentTest.state !== 'passed' && fs.existsSync(chromedriverLog)) {
      console.log("**** chromedriver log ****\n" + fs.readFileSync(chromedriverLog))
    }
    if (this.currentTest.state !== 'passed' && fs.existsSync(chromeLog)) {
      console.log("**** chrome log ****\n" + fs.readFileSync(chromeLog))
    }
    if (driver !== undefined) {
      printLogs(await driver.manage().logs().get(logging.Type.BROWSER));
      await driver.quit();
    }
  })
})
