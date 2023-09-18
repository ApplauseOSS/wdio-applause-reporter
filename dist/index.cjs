'use strict';

var WDIOReporter = require('@wdio/reporter');
var applauseReporterCommon = require('applause-reporter-common');

class ApplauseWdioReporter extends WDIOReporter {
    reporter;
    constructor(options) {
        super({ stdout: true, ...options });
        const config = applauseReporterCommon.loadConfig({
            properties: options,
        });
        // Setup the initial maps
        this.reporter = new applauseReporterCommon.ApplauseReporter(config);
    }
    onRunnerStart() {
        this.reporter.runnerStart();
    }
    onTestStart(testStats) {
        this.reporter.startTestCase(testStats.uid, testStats.fullTitle, {
            providerSessionIds: [browser.sessionId],
        });
    }
    onTestPass(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.PASSED);
    }
    onTestFail(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.FAILED, {
            failureReason: test.error?.message,
        });
    }
    onTestRetry(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
        });
    }
    onTestSkip(test) {
        this.reporter.submitTestCaseResult(test.uid, applauseReporterCommon.TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
        });
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
