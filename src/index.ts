import WDIOReporter, { RunnerStats, TestStats } from '@wdio/reporter';
import { Client } from 'webdriver';
// eslint-disable-next-line node/no-extraneous-import
import { AutoApi, TestResultStatus } from 'auto-api-client-js';
import { ApplauseOptions } from './applause-options';
import { writeFileSync } from 'fs';
import { join as pathJoin } from 'path';

declare let browser: Client;

export class ApplauseReporter extends WDIOReporter {
  private readonly autoapi: AutoApi;
  private uidToResultIdMap: Record<string, Promise<number>>;

  /**
   * overwrite isSynchronised method
   */
  get isSynchronised(): boolean {
    return this.autoapi.getCallsInFlight === 0;
  }

  constructor(optionsIn: ApplauseOptions) {
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
      .startTestCase(testStats.title, browser.sessionId)
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

  async onRunnerEnd(_stats: RunnerStats): Promise<void> {
    const valuePromises: Promise<number>[] = Object.values(
      this.uidToResultIdMap
    );
    let resultIds: number[] = [];
    await Promise.all(valuePromises)
      .then(vals => (resultIds = vals == null ? [] : vals))
      .catch(() => console.error('Unable to retrieve Applause TestResultIds'));
    const resp = await this.autoapi.getProviderSessionLinks(resultIds);
    const jsonArray = resp.data || [];
    if (jsonArray.length > 0) {
      console.info(JSON.stringify(jsonArray));
      // this is the wdio.conf outputDir
      const outputPath = _stats.config.outputDir || '.';
      writeFileSync(
        pathJoin(outputPath, 'providerUrls.txt'),
        JSON.stringify(jsonArray, null, 1)
      );
    }
  }
}

// re-export this so its public to our module users
export { ApplauseOptions } from './applause-options';
