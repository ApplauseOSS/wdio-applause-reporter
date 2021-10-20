'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var WDIOReporter = require('@wdio/reporter');
var autoApiClientJs = require('auto-api-client-js');

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
            .startTestCase(testStats.title)
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
}

exports.ApplauseReporter = ApplauseReporter;
//# sourceMappingURL=index.js.map
