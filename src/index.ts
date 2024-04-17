import WDIOReporter, { TestStats } from '@wdio/reporter';
import {
  ApplauseReporter,
  ApplauseConfig,
  TestResultStatus,
  loadConfig,
} from 'applause-reporter-common';
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

export class ApplauseWdioReporter extends WDIOReporter {
  private reporter: ApplauseReporter;

  // A Map of test case name and retry number to the uid of the result
  private testCaseHistory: Map<string, string[]> = new Map()

  constructor(options: Partial<ApplauseConfig>) {
    super({ stdout: true, ...options });
    const config = loadConfig({
      properties: options,
    });
    // Setup the initial maps
    this.reporter = new ApplauseReporter(config);
    process.on('applause:screenshot' as any, (data: any) => this.customHook(data))

  }

  onRunnerStart() {
    this.reporter.runnerStart();
  }

  onTestStart(testStats: TestStats): void {
    if (!this.testCaseHistory.has(testStats.fullTitle)) {
      this.testCaseHistory.set(testStats.fullTitle, [])
    }
    this.testCaseHistory.get(testStats.fullTitle)?.push(testStats.uid);
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

  // @ts-ignore
  async customHook(res: { testCase: string, retryNum: number, content: Buffer}) {
    console.log("Before");
    // logger.info("Received Failure Screenshot for : " + res.testCase);
    console.log("After");
    // await this.reporter.attachTestCaseAsset(this.testCaseHistory.get(res.testCase)?.at(res.retryNum)!, "failure_screenshot.png", browser.sessionId, "FAILURE_SCREENSHOT", res.content);
  }

  async onRunnerEnd(): Promise<void> {
    await this.reporter.runnerEnd();
  }

  get isSynchronised(): boolean {
    return this.reporter.isSynchronized();
  }
}

export { ApplauseConfig };
