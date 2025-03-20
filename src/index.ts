import WDIOReporter, { TestStats } from '@wdio/reporter';
import { Frameworks, Services } from '@wdio/types';
import {
  APPLAUSE_LOG_RECORDS,
  ApplauseConfig,
  ApplauseReporter,
  AssetType,
  constructDefaultLogger,
  loadConfig,
  parseTestCaseName,
  PublicApi,
  TestResultStatus,
  TestRunAutoResultStatus,
} from 'applause-reporter-common';
import * as winston from 'winston';

export class ApplauseRunService implements Services.ServiceInstance {
  reporter: ApplauseReporter;
  logger: winston.Logger;

  constructor(serviceOptions: Services.ServiceOption) {
    this.logger =
      (serviceOptions['logger'] as winston.Logger) || constructDefaultLogger();
    this.reporter = new ApplauseReporter(
      loadConfig(serviceOptions),
      this.logger
    );
  }

  async onPrepare() {
    const testRunId = await this.reporter.runnerStart();
    process.env['APPLAUSE_RUN_ID'] = `${testRunId}`;
  }

  async onComplete() {
    await this.reporter.runnerEnd();
  }
}

export class ApplauseResultService implements Services.ServiceInstance {
  reporter: ApplauseReporter;
  logger: winston.Logger;
  activeTest?: string;

  constructor(serviceOptions: Services.ServiceOption) {
    this.logger =
      (serviceOptions['logger'] as winston.Logger) || constructDefaultLogger();
    this.reporter = new ApplauseReporter(
      loadConfig(serviceOptions),
      this.logger
    );
  }

  /**
   * Before test hook. This is called for tests executed by the Mocha or Jasmine framework. See beforeScenario for
   * execution of Cucumber tests.
   *
   * @param test The test object
   */
  async beforeTest(test: Frameworks.Test) {
    const title = this.lookupTitle(test);
    this.logger.info('Starting test: ' + title);
    this.activeTest = title;
    await this.reporter.startTestCase(title, title, {
      providerSessionIds: [],
    });
  }

  /**
   * The beforeScenario hook is called before each scenario in a Cucumber test.
   *
   * @param world The cucumber world object
   */
  async beforeScenario(world: Frameworks.World) {
    const title = this.lookupTitle(world);
    this.logger.info('Starting Scenario: ' + title);
    this.activeTest = title;
    await this.reporter.startTestCase(title, title, {
      providerSessionIds: [],
    });
  }

  async afterCommand(
    commandName: string,
    args: unknown[],
    result: unknown
  ): Promise<void> {
    if (!this.activeTest) {
      return;
    }
    if (commandName.startsWith('saveScreenshot')) {
      const screenshotName =
        (args[0] as string).split('/').pop() || 'screenshot.png';
      this.logger.debug('Capturing screenshot');
      await this.reporter.attachTestCaseAsset(
        this.activeTest,
        screenshotName,
        browser.sessionId,
        AssetType.SCREENSHOT,
        Buffer.from(result as string, 'base64')
      );
    }
  }

  /**
   * The afterTest hook is called after each test in a Mocha or Jasmine test.
   *
   * @param test The test object
   * @param _context The context object
   * @param result The result object
   */
  async afterTest(
    test: Frameworks.Test,
    _context: unknown,
    result: Frameworks.TestResult
  ) {
    this.activeTest = undefined;
    const title = this.lookupTitle(test);
    if (result.passed) {
      this.logger.info('Test Passed: ' + title + ' (' + browser.sessionId + ')');
    } else {
      this.logger.error('Test Failed: ' + title);
    }
    const errorMessage: string  = result.error?.message || result.exception;
    let status = TestResultStatus.FAILED;

    if (result.passed) {
      status = TestResultStatus.PASSED;
    } else if (errorMessage.includes('skip')) {
      status = TestResultStatus.SKIPPED;
    }
    await this.reporter.submitTestCaseResult(
      title,
      status,
      {
        failureReason: errorMessage,
        providerSessionGuids: [browser.sessionId],
      }
    );
    await this.captureAssets(title, result.passed);
  }

  /**
   * The afterScenario hook is called after each scenario in a Cucumber test.
   *
   * @param world The cucumber world object
   * @param result The result object
   */
  async afterScenario(world: Frameworks.World, result: Frameworks.TestResult) {
    this.activeTest = undefined;
    const title = this.lookupTitle(world);
    if (result.passed) {
      this.logger.info('Test Passed: ' + title);
    } else {
      this.logger.error('Test Failed: ' + title);
    }
    const errorMessage: string  = result.error?.message || result.exception;
    await this.reporter.submitTestCaseResult(
      title,
      result.passed ? TestResultStatus.PASSED : TestResultStatus.FAILED,
      {
        failureReason: errorMessage,
        providerSessionGuids: [browser.sessionId],
      }
    );
    await this.captureAssets(title, result.passed);
  }

  /**
   * Function to lookup the title from a Test or World object. WebdriverIO is inconsistent with where the title is stored. In some
   * cases it is in the `fullName` property, in others it is in the `fullTitle` property, and in others it is in the `title` property.
   * For cucumber, it is stored in the `pickle.name` property. If none of these are found, it will return '<Unknown Test>'.
   *
   * @param test The test or world object
   * @returns The title of the test
   */
  private lookupTitle(
    test: Partial<Frameworks.Test & Frameworks.World>
  ): string {
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
  private async captureAssets(
    resultId: string,
    passed: boolean
  ): Promise<void> {
    const assetsToUpload: [string, AssetType, Buffer][] = [];
    try {
      if (!passed) {
        const screenshot = Buffer.from(
          await browser.takeScreenshot(),
          'base64'
        );
        assetsToUpload.push([
          'failure_screenshot.png',
          AssetType.FAILURE_SCREENSHOT,
          screenshot,
        ]);
      }
      assetsToUpload.push([
        'page_source.html',
        AssetType.PAGE_SOURCE,
        Buffer.from(await browser.getPageSource()),
      ]);
      assetsToUpload.push([
        'console_log.txt',
        AssetType.CONSOLE_LOG,
        Buffer.from(APPLAUSE_LOG_RECORDS.getLogs().join('\n')),
      ]);

      await Promise.allSettled(
        assetsToUpload.map(([name, type, data]) =>
          this.reporter.attachTestCaseAsset(
            resultId,
            name,
            browser.sessionId,
            type,
            data
          )
        )
      );
    } catch (e) {
      this.logger.error('Error capturing assets');
      this.logger.error(e);
    }
  }
}

export class ApplausePlatformWdioReporter extends WDIOReporter {
  private publciApi: PublicApi;
  private config: ApplauseConfig;
  private inflightCalls: Promise<unknown>[] = [];
  private logger: winston.Logger;

  constructor(options: Partial<ApplauseConfig & { logger: winston.Logger }>) {
    super({ stdout: true, ...options });
    this.config = loadConfig({
      properties: options,
    });
    this.logger =
      (options.logger as winston.Logger) || constructDefaultLogger();
    // Setup the initial maps
    this.publciApi = new PublicApi(this.config, this.logger);
  }

  onTestPass(test: TestStats): void {
    const applauseTestCaseId = parseTestCaseName(
      test.fullTitle
    ).applauseTestCaseId;
    if (applauseTestCaseId !== undefined) {
      this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) passed`);
      const caps = browser.capabilities;
      this.inflightCalls.push(
        this.publciApi.submitResult(Number(applauseTestCaseId), {
          testCycleId: this.config.applauseTestCycleId!,
          status: TestRunAutoResultStatus.PASSED,
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
        })
      );
    }
  }

  onTestFail(test: TestStats): void {
    const applauseTestCaseId = parseTestCaseName(
      test.fullTitle
    ).applauseTestCaseId;
    if (applauseTestCaseId !== undefined) {
      this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) failed`);
      const caps = browser.capabilities;
      this.inflightCalls.push(
        this.publciApi.submitResult(Number(applauseTestCaseId), {
          testCycleId: this.config.applauseTestCycleId!,
          status: TestRunAutoResultStatus.FAILED,
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
        })
      );
    }
  }

  onTestSkip(test: TestStats): void {
    const applauseTestCaseId = parseTestCaseName(
      test.fullTitle
    ).applauseTestCaseId;
    if (applauseTestCaseId !== undefined) {
      this.logger.info(`Test ${test.fullTitle}(${applauseTestCaseId}) skipped`);
      const caps = browser.capabilities;
      this.inflightCalls.push(
        this.publciApi.submitResult(Number(applauseTestCaseId), {
          testCycleId: this.config.applauseTestCycleId!,
          status: TestRunAutoResultStatus.SKIPPED,
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
        })
      );
    }
  }

  async onRunnerEnd(): Promise<void> {
    void (await Promise.all(this.inflightCalls));
  }

  get isSynchronised(): boolean {
    return this.publciApi.getCallsInFlight === 0;
  }
}
