import WDIOReporter, { TestStats } from '@wdio/reporter';
// eslint-disable-next-line node/no-extraneous-import
import type { Reporters } from '@wdio/types';
import { AutoApi, TestResultStatus } from 'auto-api-client-js';
import { ApplauseOptions } from './applause-options';

export class ApplauseReporter extends WDIOReporter {
  private readonly autoapi: AutoApi;
  private uidToResultIdMap: Record<string, Promise<number>>;

  /**
   * overwrite isSynchronised method
   */
  get isSynchronised(): boolean {
    return this.autoapi.getCallsInFlight === 0;
  }

  constructor(optionsIn: Partial<Reporters.Options> & ApplauseOptions) {
    /*
     * make reporter to write to the output stream by default
     */
    const options = { ...{ stdout: true }, ...optionsIn };
    super(options);
    this.uidToResultIdMap = {};
    this.autoapi = new AutoApi({
      clientConfig: {
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
      },
      productId: options.productId,
    });
  }

  /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
  onTestStart(testStats: TestStats): void {
    this.uidToResultIdMap[testStats.uid] = this.autoapi
      .startTestCase(testStats.title)
      .then(res => {
        return res.data.testResultId;
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTestPass(test: TestStats): Promise<void> {
    const currentResultId = await this.uidToResultIdMap[test.uid];
    await this.autoapi.submitTestResult(
      currentResultId,
      TestResultStatus.PASSED
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTestFail(test: TestStats): Promise<void> {
    const currentResultId = await this.uidToResultIdMap[test.uid];
    await this.autoapi.submitTestResult(
      currentResultId,
      TestResultStatus.FAILED
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTestRetry(test: TestStats): Promise<void> {
    const currentResultId = await this.uidToResultIdMap[test.uid];
    await this.autoapi.submitTestResult(
      currentResultId,
      TestResultStatus.SKIPPED
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onTestSkip(test: TestStats): Promise<void> {
    const currentResultId = await this.uidToResultIdMap[test.uid];
    await this.autoapi.submitTestResult(
      currentResultId,
      TestResultStatus.SKIPPED
    );
  }
}

// re-export this so its public to our module users
export { ApplauseOptions } from './applause-options';
