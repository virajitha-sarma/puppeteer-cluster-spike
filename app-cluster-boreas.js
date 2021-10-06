const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const { Cluster } = require("puppeteer-cluster");
const blocked = require("blocked-at");

const args = ["--enable-logging", "--v=1", "--disable-dev-shm-usage"];

let cluster;

(async () => {
  //Create cluster with 10 workers
  console.log("Creating workers ");
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
})();

//End point that receives PDF generation requests
//---http://localhost:3200/pdf?target=http://www.google.com----------
app.get("/pdf", async (req, res) => {
  const urlpdf = req.query.target;
  console.log("request " + urlpdf);

  //"options" contains the "response" object that is used by the task "createPdf" to send back the geneated PDF

  const options = { url: urlpdf, response: res };

  //Requests get queued and "createPdf" is the task that gets executed for each queued request

  const result = cluster.queue(options, createPdf);
  //result is empty and doesnot contain the pdf that the task "createPdf" generates
  // res.end();

  //Probably polling should be done to check if in the last x minutes there is no request then Cluster should be closed
  //For POC, to check concurrency support cluster is left open
  //await cluster.idle();
  //await cluster.close();
});

/*
  Task to be performed for queued job
 */
const createPdf = async ({ page, data: pdfData }) => {
  console.log("Processing request " + pdfData.url);

  //For Authentication
  await page.evaluateOnNewDocument((token) => {
    localStorage.clear();
    localStorage.setItem("idp_tokens", token);
  }, '{"acme":{"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ0eXAiOiJCZWFyZXIiLCJhdWQiOiJhY2NvdW50IiwiZXhwIjoxNjMzMzYzODA0LCJpYXQiOjE2MzMzNjM1MDQsInVwbiI6InZpcmFqaXRoYS5zYXJtYUBsb2dyaHl0aG0uY29tIiwiaXNzIjoibG9ncmh5dGhtLWRldmVsb3BtZW50Iiwic3ViIjoiOWQ1ZDY3NzYtNTRlOS00NmNlLThkNzYtNjlhNzI4ZjRiZmQ5IiwidGVuYW50X2lkIjoiYWNtZSIsImNhcGFiaWxpdGllcyI6WyJNQU5BR0VfUEFTU1dPUkRfUE9MSUNJRVMiLCJNQU5BR0VfTk9USUZJQ0FUSU9OUyIsIlZJRVdfTkFWSUdBVElPTl9TVUdHRVNUSU9OUyIsIk1BTkFHRV9DT05URU5UIiwiTUFOQUdFX0NPTExFQ1RPUlMiLCJNQU5BR0VfRU5USVRJRVMiLCJFWEVDVVRFX1NFQVJDSCIsIk1BTkFHRV9ST0xFUyIsIkJPUkVBU19VU0VSIiwiTUFOQUdFX0FHRU5UUyIsIk1BTkFHRV9GSUxURVJTIiwiTUFOQUdFX0FVRElUIiwiTUFOQUdFX1RFTkFOVF9TRVRUSU5HUyIsIk1BTkFHRV9VU0VSUyJdLCJuYW1lIjoiVmlyYWppdGhhIFNhcm1hIiwiZ2l2ZW5fbmFtZSI6IlZpcmFqaXRoYSIsImZhbWlseV9uYW1lIjoiU2FybWEiLCJlbWFpbCI6InZpcmFqaXRoYS5zYXJtYUBsb2dyaHl0aG0uY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidmlyYWppdGhhLnNhcm1hQGxvZ3JoeXRobS5jb20iLCJqdGkiOiI0ZDUyOGEzMi1jOTUzLTQ2YTMtYmNjNC1mYjA2YjdiMzJkOGQifQ.jx4KaK0S90SYlARVXCKZ0weBralsUSijJ9r_kd3lbADNXUMInh0d4WPQJkfgsRHAJbEjRqdcYihQA0YHfykzHQeimTwIfKqFAH9nLrjdrxYxd8QBi_BfsdjlHE2YAMU-DddgYEaVqVLJnBQ213hwiC_RIXRYjT6AbizDAJOMcTJEaCA_6ItO4e4yQES_ZrJWE0AUkmzbR7m3ddixI4lDwAQ64uBqLRvmxnm3PmuVCtI9c4MHSMBF0RkKddYLpGIPntPfZ0JHNWKhG5rMJ21IRnjsDB0o0IFVnuHDOh290l9JqY9z4BxF4fHUCtr1kzHvmdH1OQpy8v0higwU1t1vtQ","tenantId":"acme","capabilities":["BOREAS_USER","EXECUTE_SEARCH","MANAGE_AGENTS","MANAGE_AUDIT","MANAGE_COLLECTORS","MANAGE_CONTENT","MANAGE_ENTITIES","MANAGE_FILTERS","MANAGE_NOTIFICATIONS","MANAGE_PASSWORD_POLICIES","MANAGE_ROLES","MANAGE_TENANT_SETTINGS","MANAGE_USERS","VIEW_NAVIGATION_SUGGESTIONS"]}}');

  await page.goto(pdfData.url, {
    waitUntil: "networkidle0",
    timeout: 0,
  });
  console.log("creating pdf");

  const pdf = await page.pdf({
    printBackground: true,
    format: "A4",
    margin: {},
  });
  //PDF generated here is send in the response..
  pdfData.response.contentType("application/pdf");
  pdfData.response.set("Content-Length", Buffer.byteLength(pdf));
  pdfData.response.set(
    "Content-Disposition",
    "attachment; filename=report.pdf"
  );
  // *Should check how to force download the file for load testing... *

  return pdfData.response.send(pdf);
};

//Server runs on port 3200
app.listen(3200, () => {
  console.log("Server listening on port 3200");
});
