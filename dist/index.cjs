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
    async onRunnerEnd() {
        await this.reporter.runnerEnd();
    }
    get isSynchronised() {
        return this.reporter.isSynchronized();
    }
}
class ApplausePlatformWdioReporter extends WDIOReporter {
    publciApi;
    config;
    inflightCalls = [];
    constructor(options) {
        super({ stdout: true, ...options });
        this.config = applauseReporterCommon.loadConfig({
            properties: options,
        });
        // Setup the initial maps
        this.publciApi = new applauseReporterCommon.PublicApi(this.config);
    }
    onTestPass(test) {
        const applauseTestCaseId = applauseReporterCommon.parseTestCaseName(test.fullTitle).applauseTestCaseId;
        if (applauseTestCaseId !== undefined) {
            const caps = browser.capabilities;
            this.inflightCalls.push(this.publciApi.submitResult(Number(applauseTestCaseId), {
                testCycleId: this.config.applauseTestCycleId,
                status: applauseReporterCommon.TestRunAutoResultStatus.PASSED,
                sessionDetailsJson: {
                    value: {
                        deviceName: caps['appium:deviceName'],
                        orientation: caps['appium:orientation'],
                        platformName: caps.platformName,
                        platformVersion: caps['appium:platformVersion'],
                        browserName: caps.browserName,
                        browserVersion: caps.browserVersion,
                    },
                },
            }));
        }
    }
    onTestFail(test) {
        const applauseTestCaseId = applauseReporterCommon.parseTestCaseName(test.fullTitle).applauseTestCaseId;
        if (applauseTestCaseId !== undefined) {
            const caps = browser.capabilities;
            this.inflightCalls.push(this.publciApi.submitResult(Number(applauseTestCaseId), {
                testCycleId: this.config.applauseTestCycleId,
                status: applauseReporterCommon.TestRunAutoResultStatus.FAILED,
                sessionDetailsJson: {
                    value: {
                        deviceName: caps['appium:deviceName'],
                        orientation: caps['appium:orientation'],
                        platformName: caps.platformName,
                        platformVersion: caps['appium:platformVersion'],
                        browserName: caps.browserName,
                        browserVersion: caps.browserVersion,
                    },
                },
            }));
        }
    }
    onTestSkip(test) {
        const applauseTestCaseId = applauseReporterCommon.parseTestCaseName(test.fullTitle).applauseTestCaseId;
        if (applauseTestCaseId !== undefined) {
            const caps = browser.capabilities;
            this.inflightCalls.push(this.publciApi.submitResult(Number(applauseTestCaseId), {
                testCycleId: this.config.applauseTestCycleId,
                status: applauseReporterCommon.TestRunAutoResultStatus.SKIPPED,
                sessionDetailsJson: {
                    value: {
                        deviceName: caps['appium:deviceName'],
                        orientation: caps['appium:orientation'],
                        platformName: caps.platformName,
                        platformVersion: caps['appium:platformVersion'],
                        browserName: caps.browserName,
                        browserVersion: caps.browserVersion,
                    },
                },
            }));
        }
    }
    async onRunnerEnd() {
        void (await Promise.all(this.inflightCalls));
    }
    get isSynchronised() {
        return this.publciApi.getCallsInFlight === 0;
    }
}

exports.ApplausePlatformWdioReporter = ApplausePlatformWdioReporter;
exports.ApplauseWdioReporter = ApplauseWdioReporter;
//# sourceMappingURL=index.cjs.map
