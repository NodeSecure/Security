// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// Import Internal Dependencies
import { buildStatsFromNsecurePayloads } from "../analysis/extractScannerData.js";
import { HTML, PDF } from "../reporting/index.js";

/**
 * Determine the final location of the report (on current working directory or in a temporary directory)
 * @param {string} location
 * @param {object} options
 * @param {boolean} options.includesPDF
 * @param {boolean} options.savePDFOnDisk
 * @param {boolean} options.saveHTMLOnDisk
 * @returns {Promise<string>}
 */
async function reportLocation(location, options) {
  const {
    includesPDF,
    savePDFOnDisk,
    saveHTMLOnDisk
  } = options;

  if (location) {
    return location;
  }

  if ((includesPDF && savePDFOnDisk) || saveHTMLOnDisk) {
    return process.cwd();
  }

  return fs.mkdtemp(path.join(os.tmpdir(), "nsecure-report-"));
}

export async function report(
  scannerDependencies,
  reportConfig,
  reportOptions = Object.create(null)
) {
  const {
    reportOutputLocation = null,
    savePDFOnDisk = false,
    saveHTMLOnDisk = false
  } = reportOptions;
  const includesPDF = reportConfig.reporters.includes("pdf");
  const includesHTML = reportConfig.reporters.includes("html");
  if (!includesPDF && !includesHTML) {
    throw new Error("At least one reporter must be enabled (pdf or html)");
  }

  const [pkgStats, finalReportLocation] = await Promise.all([
    buildStatsFromNsecurePayloads(scannerDependencies, {
      isJson: true,
      reportConfig
    }),
    reportLocation(reportOutputLocation, { includesPDF, savePDFOnDisk, saveHTMLOnDisk })
  ]);

  let reportHTMLPath;
  try {
    reportHTMLPath = await HTML(
      {
        pkgStats,
        repoStats: null
      },
      reportConfig,
      finalReportLocation
    );

    if (reportConfig.reporters.includes("pdf")) {
      return await PDF(reportHTMLPath, {
        title: reportConfig.title,
        saveOnDisk: savePDFOnDisk,
        reportOutputLocation: finalReportLocation
      });
    }

    return reportHTMLPath;
  }
  finally {
    if (reportHTMLPath && (!includesHTML || saveHTMLOnDisk === false)) {
      await fs.rm(reportHTMLPath, {
        force: true,
        recursive: true
      });
    }
  }
}
