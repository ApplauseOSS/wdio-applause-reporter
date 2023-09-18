import WDIOReporter from '@wdio/reporter';
import { loadConfig, ApplauseReporter, TestResultStatus } from 'applause-reporter-common';

class ApplauseWdioReporter extends WDIOReporter {
    reporter;
    constructor(options) {
        super({ stdout: true, ...options });
        const config = loadConfig({
            properties: options,
        });
        // Setup the initial maps
        this.reporter = new ApplauseReporter(config);
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
        this.reporter.submitTestCaseResult(test.uid, TestResultStatus.PASSED);
    }
    onTestFail(test) {
        this.reporter.submitTestCaseResult(test.uid, TestResultStatus.FAILED, {
            failureReason: test.error?.message,
        });
    }
    onTestRetry(test) {
        this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
        });
    }
    onTestSkip(test) {
        this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
            failureReason: test.error?.message,
        });
    }
    async onRunnerEnd() {
        await this.reporter.runnerEnd();
    }
}

export { ApplauseWdioReporter };
//# sourceMappingURL=index.mjs.map
