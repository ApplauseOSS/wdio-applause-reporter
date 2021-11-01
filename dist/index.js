'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var WDIOReporter = require('@wdio/reporter');
var autoApiClientJs = require('auto-api-client-js');
var fs = require('fs');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var WDIOReporter__default = /*#__PURE__*/_interopDefaultLegacy(WDIOReporter);

class ApplauseReporter extends WDIOReporter__default['default'] {
    constructor(optionsIn) {
        /*
         * make reporter to write to the output stream by default
         */
        const options = { ...{ stdout: true }, ...optionsIn };
        super(options);
        this.uidToResultIdMap = {};
        this.autoapi = new autoApiClientJs.AutoApi({
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
            .startTestCase(testStats.title, browser.sessionId)
            .then(res => {
            return res.data.testResultId;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestPass(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, autoApiClientJs.TestResultStatus.PASSED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestFail(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, autoApiClientJs.TestResultStatus.FAILED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestRetry(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, autoApiClientJs.TestResultStatus.SKIPPED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onTestSkip(test) {
        const currentResultId = await this.uidToResultIdMap[test.uid];
        await this.autoapi.submitTestResult(currentResultId, autoApiClientJs.TestResultStatus.SKIPPED);
    }
    async onRunnerEnd(_stats) {
        const valuePromises = Object.values(this.uidToResultIdMap);
        let resultIds = [];
        void Promise.all(valuePromises)
            .then(vals => (resultIds = vals == null ? [] : vals))
            .catch(() => console.error('Unable to retrieve Applause TestResultIds'));
        const resp = await this.autoapi.getProviderSessionLinks(resultIds);
        const jsonArray = resp.data || [];
        if (jsonArray.length > 0) {
            console.info(JSON.stringify(jsonArray));
            // this is the wdio.conf outputDir
            const outputPath = _stats.config.outputDir || '.';
            fs.writeFileSync(path.join(outputPath, 'providerUrls.txt'), JSON.stringify(jsonArray, null, 1));
        }
    }
}

exports.ApplauseReporter = ApplauseReporter;
//# sourceMappingURL=index.js.map
