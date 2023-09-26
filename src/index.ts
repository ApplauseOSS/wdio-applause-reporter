import WDIOReporter, { TestStats } from '@wdio/reporter';
import {
  ApplauseReporter,
  ApplauseConfig,
  TestResultStatus,
  loadConfig,
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

export { ApplauseConfig };
