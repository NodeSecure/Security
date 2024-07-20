// Import Node.js Dependencies
import path from "node:path";
import { pathToFileURL } from "node:url";

// Import Third-party Dependencies
import puppeteer from "puppeteer";

// Import Internal Dependencies
import * as CONSTANTS from "../constants.js";
import * as utils from "../utils/index.js";

export async function PDF(
  reportHTMLPath,
  options
) {
  const {
    title,
    saveOnDisk = true,
    reportOutputLocation = CONSTANTS.DIRS.REPORTS
  } = options;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.emulateMediaType("print");
    await page.goto(pathToFileURL(reportHTMLPath).href, {
      waitUntil: "networkidle0",
      timeout: 20_000
    });

    const reportPath = saveOnDisk ? path.join(
      reportOutputLocation,
      utils.cleanReportName(title, ".pdf")
    ) : undefined;
    const pdfBuffer = await page.pdf({
      path: reportPath,
      format: "A4",
      printBackground: true
    });

    return saveOnDisk ? reportPath : pdfBuffer;
  }
  finally {
    await page.close();
    await browser.close();
  }
}

