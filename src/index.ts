import WDIOReporter, { TestStats } from '@wdio/reporter';
import {
  ApplauseReporter,
  ApplauseConfig,
  TestResultStatus,
  loadConfig,
  PublicApi,
  parseTestCaseName,
  TestRunAutoResultStatus,
} from 'applause-reporter-common';
import { Browser } from 'webdriverio';

declare let browser: Browser;

export class ApplauseWdioReporter extends WDIOReporter {
  private reporter: ApplauseReporter;

  constructor(options: Partial<ApplauseConfig>) {
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

  onTestStart(testStats: TestStats): void {
    this.reporter.startTestCase(testStats.uid, testStats.fullTitle, {
      providerSessionIds: [browser.sessionId],
    });
  }

  onTestPass(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.PASSED, {
      providerSessionGuids: [browser.sessionId],
    });
  }

  onTestFail(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.FAILED, {
      failureReason: test.error?.message,
      providerSessionGuids: [browser.sessionId],
    });
  }

  onTestRetry(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
      failureReason: test.error?.message,
      providerSessionGuids: [browser.sessionId],
    });
  }

  onTestSkip(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
      failureReason: test.error?.message,
      providerSessionGuids: [browser.sessionId],
    });
  }

  async onRunnerEnd(): Promise<void> {
    await this.reporter.runnerEnd();
  }

  get isSynchronised(): boolean {
    return this.reporter.isSynchronized();
  }
}

export class ApplausePlatformWdioReporter extends WDIOReporter {
  private publciApi: PublicApi;
  private config: ApplauseConfig;
  private inflightCalls: Promise<any>[] = [];

  constructor(options: Partial<ApplauseConfig>) {
    super({ stdout: true, ...options });
    this.config = loadConfig({
      properties: options,
    });
    // Setup the initial maps
    this.publciApi = new PublicApi(this.config);
  }

  onTestPass(test: TestStats): void {
    const applauseTestCaseId = parseTestCaseName(
      test.fullTitle
    ).applauseTestCaseId;
    if (applauseTestCaseId !== undefined) {
      const caps = browser.capabilities as WebdriverIO.Capabilities;
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
      const caps = browser.capabilities as WebdriverIO.Capabilities;
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
      const caps = browser.capabilities as WebdriverIO.Capabilities;
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

export { ApplauseConfig };
