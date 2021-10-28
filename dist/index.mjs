import WDIOReporter from '@wdio/reporter';
import { AutoApi, TestResultStatus } from 'auto-api-client-js';

class ApplauseReporter extends WDIOReporter {
    constructor(optionsIn) {
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
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised() {
        return this.autoapi.getCallsInFlight === 0;
    }
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats) {
        this.uidToResultIdMap[testStats.uid] = this.autoapi
            .startTestCase(testStats.title)
            .then(res => {
            return res.data.testResultId;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestPass(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, TestResultStatus.PASSED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestFail(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, TestResultStatus.FAILED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestRetry(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, TestResultStatus.SKIPPED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestSkip(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, TestResultStatus.SKIPPED);
    }
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    async onRunnerEnd(_stats) {
        const valuePromises = Object.values(this.uidToResultIdMap);
        let resultIds = [];
        void Promise.all(valuePromises)
            .then(vals => (resultIds = vals == null ? [] : vals))
            .catch(() => console.error('Unable to retrieve Applause TestResultIds'));
        const resp = await this.autoapi.getProviderSessionLinks(resultIds);
        console.info(resp.data);
    }
}

export { ApplauseReporter };
//# sourceMappingURL=index.mjs.map
