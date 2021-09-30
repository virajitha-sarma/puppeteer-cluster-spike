const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const { Cluster } = require("puppeteer-cluster");

const args = ["--enable-logging", "--v=1", "--disable-dev-shm-usage"];

let cluster;

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
  }, "%TOKEN%");

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
  //PDF generated here is send in the response..Which makes the complete flow synchronous
  pdfData.response.end(pdf);
};

//Server runs on port 3200
app.listen(3200, () => {
  console.log("Server listening on port 3200");
});
