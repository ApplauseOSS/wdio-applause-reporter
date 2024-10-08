'use strict';

var WDIOReporter = require('@wdio/reporter');
var applauseReporterCommon = require('applause-reporter-common');

class ApplauseRunService {
    reporter;
    logger;
    // @ts-ignore
    constructor(serviceOptions) {
        this.logger =
            serviceOptions['logger'] || applauseReporterCommon.constructDefaultLogger();
        this.reporter = new applauseReporterCommon.ApplauseReporter(applauseReporterCommon.loadConfig(serviceOptions), this.logger);
    }
    // @ts-ignore
    async onPrepare() {
        const testRunId = await this.reporter.runnerStart();
        process.env['APPLAUSE_RUN_ID'] = `${testRunId}`;
    }
    // @ts-ignore
    async onComplete() {
        await this.reporter.runnerEnd();
    }
}
class ApplauseResultService {
    reporter;
    logger;
    activeTest;
    // @ts-ignore
    constructor(serviceOptions) {
        this.logger =
            serviceOptions['logger'] || applauseReporterCommon.constructDefaultLogger();
        this.reporter = new applauseReporterCommon.ApplauseReporter(applauseReporterCommon.loadConfig(serviceOptions), this.logger);
    }
    /**
     * Before test hook. This is called for tests executed by the Mocha or Jasmine framework. See beforeScenario for
     * execution of Cucumber tests.
     *
     * @param test The test object
     */
    async beforeTest(test) {
        const title = this.lookupTitle(test);
        this.logger.info('Starting test: ' + title);
        this.activeTest = title;
        await this.reporter.startTestCase(title, title, {
            providerSessionIds: [browser.sessionId],
        });
    }
    /**
     * The beforeScenario hook is called before each scenario in a Cucumber test.
     *
     * @param world The cucumber world object
     */
    async beforeScenario(world) {
        const title = this.lookupTitle(world);
        this.logger.info('Starting Scenario: ' + title);
        this.activeTest = title;
        await this.reporter.startTestCase(title, title, {
            providerSessionIds: [browser.sessionId],
        });
    }
    async afterCommand(commandName, args, result) {
        if (!this.activeTest) {
            return;
        }
        if (commandName.startsWith('saveScreenshot')) {
            const screenshotName = args[0].split('/').pop() || 'screenshot.png';
            this.logger.debug('Capturing screenshot');
            await this.reporter.attachTestCaseAsset(this.activeTest, screenshotName, browser.sessionId, applauseReporterCommon.AssetType.SCREENSHOT, Buffer.from(result, 'base64'));
        }
    }
    /**
     * The afterTest hook is called after each test in a Mocha or Jasmine test.
     *
     * @param test The test object
     * @param _context The context object
     * @param result The result object
     */
    async afterTest(test, _context, result) {
        this.activeTest = undefined;
        const title = this.lookupTitle(test);
        if (result.passed) {
            this.logger.info('Test Passed: ' + title);
        }
        else {
            this.logger.error('Test Failed: ' + title);
        }
        await this.captureAssets(title, result.passed);
        await this.reporter.submitTestCaseResult(title, result.passed ? applauseReporterCommon.TestResultStatus.PASSED : applauseReporterCommon.TestResultStatus.FAILED, {
            failureReason: result.exception,
        });
    }
    /**
     * The afterScenario hook is called after each scenario in a Cucumber test.
     *
     * @param world The cucumber world object
     * @param result The result object
     */
    async afterScenario(world, result) {
        this.activeTest = undefined;
        const title = this.lookupTitle(world);
        if (result.passed) {
            this.logger.info('Test Passed: ' + title);
        }
        else {
            this.logger.error('Test Failed: ' + title);
        }
        await this.captureAssets(title, result.passed);
        await this.reporter.submitTestCaseResult(title, result.passed ? applauseReporterCommon.TestResultStatus.PASSED : applauseReporterCommon.TestResultStatus.FAILED, {
            failureReason: result.exception,
        });
    }
    /**
     * Function to lookup the title from a Test or World object. WebdriverIO is inconsistent with where the title is stored. In some
     * cases it is in the `fullName` property, in others it is in the `fullTitle` property, and in others it is in the `title` property.
     * For cucumber, it is stored in the `pickle.name` property. If none of these are found, it will return '<Unknown Test>'.
     *
     * @param test The test or world object
     * @returns The title of the test
     */
    lookupTitle(test) {
        if (test.fullName) {
            return test.fullName;
        }
        if (test.fullTitle) {
            return test.fullTitle;
        }
        if (!!test.parent && !!test.title) {
            return test.parent + ' ' + test.title;
        }
        if (!!test.pickle && !!test.pickle.name) {
            return test.pickle.name;
        }
        return '<Unknown Test>';
    }
    /**
     * Function to capture assets for a test case. This includes a screenshot, page source, and console log. If the test case failed,
     * the failure screenshot will be attached to the test case.
     *
     * @param resultId The result ID of the test case
     * @param passed Whether the test case passed
     */
    async captureAssets(resultId, passed) {
        const assetsToUpload = [];
        try {
            if (!passed) {
                const screenshot = Buffer.from(await browser.takeScreenshot(), 'base64');
                assetsToUpload.push([
                    'failure_screenshot.png',
                    applauseReporterCommon.AssetType.FAILURE_SCREENSHOT,
                    screenshot,
                ]);
            }
            assetsToUpload.push([
                'page_source.html',
                applauseReporterCommon.AssetType.PAGE_SOURCE,
                Buffer.from(await browser.getPageSource()),
            ]);
            assetsToUpload.push([
                'console_log.txt',
                applauseReporterCommon.AssetType.CONSOLE_LOG,
                Buffer.from(applauseReporterCommon.APPLAUSE_LOG_RECORDS.getLogs().join('\n')),
            ]);
            await Promise.allSettled(assetsToUpload.map(([name, type, data]) => this.reporter.attachTestCaseAsset(resultId, name, browser.sessionId, type, data)));
        }
        catch (e) {
            this.logger.error('Error capturing assets');
            this.logger.error(e);
        }
    }
}
class ApplausePlatformWdioReporter extends WDIOReporter {
    publciApi;
    config;
    inflightCalls = [];
    logger;
    constructor(options) {
        super({ stdout: true, ...options });
        this.config = applauseReporterCommon.loadConfig({
            properties: options,
        });
        this.logger =
            options.logger || applauseReporterCommon.constructDefaultLogger();
        // Setup the initial maps
        this.publciApi = new applauseReporterCommon.PublicApi(this.config, this.logger);
    }
    onTestPass(test) {
        const applauseTestCaseId = applauseReporterCommon.parseTestCaseName(test.fullTitle).applauseTestCaseId;
        if (applauseTestCaseId !== undefined) {
            this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) passed`);
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
            this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) failed`);
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
            this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) skipped`);
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
exports.ApplauseResultService = ApplauseResultService;
exports.ApplauseRunService = ApplauseRunService;
//# sourceMappingURL=index.cjs.map
