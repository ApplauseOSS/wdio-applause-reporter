'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var WDIOReporter = require('@wdio/reporter');
var autoApiClientJs = require('auto-api-client-js');
var fs = require('fs');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var WDIOReporter__default = /*#__PURE__*/_interopDefaultLegacy(WDIOReporter);

class ApplauseReporter extends WDIOReporter__default['default'] {
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
        this.autoapi = new autoApiClientJs.AutoApi({
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
        this.sdkHeartbeat = new autoApiClientJs.TestRunHeartbeatService(runId, this.autoapi);
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
                status: autoApiClientJs.TestResultStatus.PASSED
            });
        });
    }
    onTestFail(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: autoApiClientJs.TestResultStatus.FAILED
            });
        });
    }
    onTestRetry(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: autoApiClientJs.TestResultStatus.SKIPPED
            });
        });
    }
    onTestSkip(test) {
        this.uidToResultIdMap[test.uid].then(currentResultId => {
            this.resultSubmissionMap[currentResultId] = this.autoapi.submitTestResult({
                testResultId: currentResultId,
                status: autoApiClientJs.TestResultStatus.SKIPPED
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
            fs.writeFileSync(path.join(outputPath, 'providerUrls.txt'), JSON.stringify(jsonArray, null, 1));
        }
        this.isEnded = true;
    }
}

exports.ApplauseReporter = ApplauseReporter;
//# sourceMappingURL=index.js.map
