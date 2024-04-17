'use strict';

var WDIOReporter = require('@wdio/reporter');
var applauseReporterCommon = require('applause-reporter-common');

// import * as winston from 'winston';
// import { MyTransport } from './logging.ts';
// export const logger = winston.createLogger({
//   transports: [
//     new MyTransport({
//       handleExceptions: true,
//       handleRejections: true,
//       silent: false
//     })
//   ]
// })
class ApplauseWdioReporter extends WDIOReporter {
    reporter;
    // A Map of test case name and retry number to the uid of the result
    testCaseHistory = new Map();
    constructor(options) {
        super({ stdout: true, ...options });
        const config = applauseReporterCommon.loadConfig({
            properties: options,
        });
        // Setup the initial maps
        this.reporter = new applauseReporterCommon.ApplauseReporter(config);
        process.on('applause:screenshot', (data) => this.customHook(data));
    }
    onRunnerStart() {
        this.reporter.runnerStart();
    }
    onTestStart(testStats) {
        if (!this.testCaseHistory.has(testStats.fullTitle)) {
            this.testCaseHistory.set(testStats.fullTitle, []);
        }
        this.testCaseHistory.get(testStats.fullTitle)?.push(testStats.uid);
        this.reporter.startTestCase(testStats.uid, testStats.fullTitle, {
            providerSessionIds: [browser.sessionId],
        });
    }
    onTestPass(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.PASSED, {
            providerSessionGuids: [browser.sessionId],
        });
    }
    onTestFail(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.FAILED, {
            failureReason: test.error?.message,
            providerSessionGuids: [browser.sessionId],
        });
    }
    onTestRetry(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
            providerSessionGuids: [browser.sessionId],
        });
    }
    onTestSkip(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
            providerSessionGuids: [browser.sessionId],
        });
    }
    // @ts-ignore
    async customHook(res) {
        console.log("Before");
        // logger.info("Received Failure Screenshot for : " + res.testCase);
        console.log("After");
        // await this.reporter.attachTestCaseAsset(this.testCaseHistory.get(res.testCase)?.at(res.retryNum)!, "failure_screenshot.png", browser.sessionId, "FAILURE_SCREENSHOT", res.content);
    }
    async onRunnerEnd() {
        await this.reporter.runnerEnd();
    }
    get isSynchronised() {
        return this.reporter.isSynchronized();
    }
}

exports.ApplauseWdioReporter = ApplauseWdioReporter;
//# sourceMappingURL=index.cjs.map
