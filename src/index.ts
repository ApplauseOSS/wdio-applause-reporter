import WDIOReporter, { TestStats } from '@wdio/reporter';
import {
  ApplauseReporter,
  ApplauseConfig,
  TestResultStatus,
} from 'applause-reporter-common';
import { Browser } from 'webdriverio';

declare let browser: Browser;

export class ApplauseWdioReporter extends WDIOReporter {
  private reporter: ApplauseReporter;

  constructor(options: ApplauseConfig) {
    super({ stdout: true, ...options });

    // Setup the initial maps
    this.reporter = new ApplauseReporter(options);
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
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.PASSED);
  }

  onTestFail(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.FAILED, {
      failureReason: test.error?.message,
    });
  }

  onTestRetry(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
      failureReason: test.error?.message,
    });
  }

  onTestSkip(test: TestStats): void {
    this.reporter.submitTestCaseResult(test.uid, TestResultStatus.SKIPPED, {
      failureReason: test.error?.message,
    });
  }

  async onRunnerEnd(): Promise<void> {
    await this.reporter.runnerEnd();
  }
}

export { ApplauseConfig };
