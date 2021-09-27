const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const { Cluster } = require("puppeteer-cluster");

const args = ["--enable-logging", "--v=1", "--disable-dev-shm-usage"];

let cluster;
let pdfResult;

(async () => {
  //Create cluster with 10 workers
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: 10,
    puppeteerOptions: {
      headless: true,
      args,
    },
    monitor: true,
    timeout: 500000,
  });

  // Print errors to console
  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);
    //const pageTitle = await page.evaluate(() => document.title);${pageTitle}
    console.log(`Page title is `);
  });
})();

const extractTitle = async ({ page, data: url }) => {
  await page.goto(url);
  //const pageTitle = await page.evaluate(() => document.title);
  console.log(`Page title is`);
};

const createPdf = async ({ page, data: pdfData }) => {
  await page.evaluateOnNewDocument((token) => {
    localStorage.clear();
    localStorage.setItem("idp_tokens", token);
  }, '{"acme":{"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ0eXAiOiJCZWFyZXIiLCJhdWQiOiJhY2NvdW50IiwiZXhwIjoxNjMyNzIyOTM5LCJpYXQiOjE2MzI3MjI2MzksInVwbiI6InZpcmFqaXRoYS5zYXJtYUBsb2dyaHl0aG0uY29tIiwiaXNzIjoibG9ncmh5dGhtLWRldmVsb3BtZW50Iiwic3ViIjoiOWQ1ZDY3NzYtNTRlOS00NmNlLThkNzYtNjlhNzI4ZjRiZmQ5IiwidGVuYW50X2lkIjoiYWNtZSIsImNhcGFiaWxpdGllcyI6WyJNQU5BR0VfRU5USVRJRVMiLCJNQU5BR0VfQ09MTEVDVE9SUyIsIk1BTkFHRV9DT05URU5UIiwiRVhFQ1VURV9TRUFSQ0giLCJNQU5BR0VfTk9USUZJQ0FUSU9OUyIsIk1BTkFHRV9BVURJVCIsIkJPUkVBU19VU0VSIiwiTUFOQUdFX1VTRVJTIiwiTUFOQUdFX1JPTEVTIiwiTUFOQUdFX1RFTkFOVF9TRVRUSU5HUyIsIk1BTkFHRV9QQVNTV09SRF9QT0xJQ0lFUyIsIlZJRVdfTkFWSUdBVElPTl9TVUdHRVNUSU9OUyIsIk1BTkFHRV9GSUxURVJTIl0sIm5hbWUiOiJWaXJhaml0aGEgU2FybWEiLCJnaXZlbl9uYW1lIjoiVmlyYWppdGhhIiwiZmFtaWx5X25hbWUiOiJTYXJtYSIsImVtYWlsIjoidmlyYWppdGhhLnNhcm1hQGxvZ3JoeXRobS5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ2aXJhaml0aGEuc2FybWFAbG9ncmh5dGhtLmNvbSIsImp0aSI6ImVhNjFlNzA1LWRhMDMtNDAxYS05NmY1LWY2NmNlMmJhOWE3YSJ9.P_iYkZTVOqsHRLgQWWMei5jqz9Au50QDnMW-JrDY4V8U994Zs8B8n8bbvtMXsLYV9cHH_2qcdvdw6blogsZVVg32O3iu83hLb39vlcd_v7TnNTZCDfvLzLqxWewtCAU2Oj9VbZqGRtHnFnt8qw2yXIAJP5Fxqpwqy2tprO4DPCtCzggVn-8V8PXaRxZD56kawQ5hC4kPxUsDgKnSYMAYkbfWx8tuxms_LTD-dbGqTpFoigcKN3NV2KhOveLxxX7BmUwev26aaWInYpHehkq0Qr9saHiXWPQi930ZSDTV3pHOoBKxxXMMNCXvNefsubOGPGEoMTck1m5P1K0bW2MluA","tenantId":"acme","capabilities":["BOREAS_USER","EXECUTE_SEARCH","MANAGE_AUDIT","MANAGE_COLLECTORS","MANAGE_CONTENT","MANAGE_ENTITIES","MANAGE_FILTERS","MANAGE_NOTIFICATIONS","MANAGE_PASSWORD_POLICIES","MANAGE_ROLES","MANAGE_TENANT_SETTINGS","MANAGE_USERS","VIEW_NAVIGATION_SUGGESTIONS"]}}');

  await page.goto(pdfData.url, {
    waitUntil: "networkidle0",
    timeout: 0,
  });
  console.log("creating pdf");

  const pdf = await page.pdf({
    printBackground: true,
    format: "A4",
    margin: {
      top: "20px",
      bottom: "40px",
      left: "20px",
      right: "20px",
    },
  });
  pdfData.response.send(pdf);
};

//const url = "https://www.google.com/";

app.get("/pdf", async (req, res) => {
  const urlpdf = req.query.target;
  const pdfToken = req.query.token;
  console.log("request " + urlpdf);

  let pdf;
  const car = { url: urlpdf, response: res, token: pdfToken };

  const result1 = cluster.queue(car, createPdf);
  // const result1 = cluster.execute(res, createPdf);
  res.contentType("application/pdf");

  //, { waitUntil: "networkidle0", timeout: 0 }

  // const result1 = await cluster.queue(url, createPdf);

  // many more pages

  //  await cluster.idle();
  //  await cluster.close();
});
app.listen(3200, () => {
  console.log("Server started");
});
/*
 docker run -i --init --rm --cap-add=SYS_ADMIN --name puppeteer-chrome puppeteer-chrome-linux node -e "`cat app.js`"
*/
