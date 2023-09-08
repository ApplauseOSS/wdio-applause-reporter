import WDIOReporter from '@wdio/reporter';
import { AutoApi, TestRunHeartbeatService, TestResultStatus } from 'auto-api-client-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

class ApplauseReporter extends WDIOReporter {
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised() {
        return this.autoapi === undefined
            ? false
            : this.autoapi.getCallsInFlight === 0 && this.isEnded;
    }
    constructor(options) {
        super({ stdout: true, ...options });
        this.testRunId = Promise.resolve(0);
        this.isEnded = true;
        // Setup the initial maps
        this.uidToResultIdMap = {};
        this.resultSubmissionMap = {};
        // Set up the auto-api client
        this.autoapi = new AutoApi({
            clientConfig: {
                baseUrl: options.baseUrl,
                apiKey: options.apiKey,
            },
            productId: options.productId,
            testRailOptions: options.testRail
        });
    }
    async onRunnerStart() {
        this.testRunId = this.autoapi.startTestRun({ tests: [] }).then(res => res.data.runId);
        let runId = await this.testRunId;
        this.isEnded = false;
        this.sdkHeartbeat = new TestRunHeartbeatService(runId, this.autoapi);
        await this.sdkHeartbeat.start();
    }
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats) {
        this.uidToResultIdMap[testStats.uid] = this.testRunId.then(runId => {
            return this.autoapi.startTestCase({
                providerSessionIds: [browser.sessionId],
                testCaseName: testStats.title,
                testRunId: runId
            });
        }).then(res => {
            return res.data.testResultId;
        });
    }
    onTestPass(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: TestResultStatus.PASSED
            });
        });
    }
    onTestFail(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: TestResultStatus.FAILED
            });
        });
    }
    onTestRetry(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: TestResultStatus.SKIPPED
            });
        });
    }
    onTestSkip(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: TestResultStatus.SKIPPED
            });
        });
    }
    async onRunnerEnd(_stats) {
        // Verify that the testRun has been created
        let runId = await this.testRunId;
        // Wait for all results to be created
        let resultIds = await Promise.all(Object.values(this.uidToResultIdMap));
        // Then wait for all results to be submitted
        await Promise.all(Object.values(this.resultSubmissionMap));
        // Shut down the heartbeat service
        await this.sdkHeartbeat?.end();
        // End the test run
        await this.autoapi.endTestRun(runId);
        // Finally get the provider session links and output them to a file
        const resp = await this.autoapi.getProviderSessionLinks(resultIds);
        const jsonArray = resp.data || [];
        if (jsonArray.length > 0) {
            console.info(JSON.stringify(jsonArray));
            // this is the wdio.conf outputDir
            const outputPath = _stats.config.outputDir || '.';
            writeFileSync(join(outputPath, 'providerUrls.txt'), JSON.stringify(jsonArray, null, 1));
        }
        this.isEnded = true;
    }
}

export { ApplauseReporter };
//# sourceMappingURL=index.mjs.map
