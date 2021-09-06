"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attribute = exports.select = void 0;
let { chromium } = await npm("playwright");
let select = async (url, selector, xf, { headless, timeout } = { headless: true, timeout: 5000 }) => {
    if (!xf)
        xf = el => el.innerText;
    let browser = await chromium.launch({ headless });
    let context = await browser.newContext();
    let page = await context.newPage();
    page.setDefaultTimeout(timeout);
    if (!url.startsWith("http"))
        url = "https://" + url;
    await page.goto(url);
    // await page.waitForSelector(selector)
    let selectorHandle = await page.$(selector);
    let results = await selectorHandle.evaluate(xf);
    await selectorHandle.dispose();
    await browser.close();
    return results;
};
exports.select = select;
let attribute = async (url, selector, attribute, { headless, timeout } = { headless: true, timeout: 5000 }) => {
    let browser = await chromium.launch({ headless, timeout });
    let context = await browser.newContext();
    let page = await context.newPage();
    page.setDefaultTimeout(timeout);
    if (!url.startsWith("http"))
        url = "https://" + url;
    await page.goto(url);
    // await page.waitForSelector(selector)
    let results = await page.getAttribute(selector, attribute);
    await browser.close();
    return results;
};
exports.attribute = attribute;
