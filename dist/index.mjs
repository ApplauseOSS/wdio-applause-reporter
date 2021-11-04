import WDIOReporter from '@wdio/reporter';
import { AutoApi, TestResultStatus } from 'auto-api-client-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

class ApplauseReporter extends WDIOReporter {
    constructor(optionsIn) {
        /*
         * make reporter to write to the output stream by default
         */
        const options = { ...{ stdout: true }, ...optionsIn };
        super(options);
        this.contructorPassedOptions = options;
        this.uidToResultIdMap = {};
    }
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised() {
        return this.autoapi === undefined
            ? false
            : this.autoapi.getCallsInFlight === 0;
    }
    onRunnerStart(runnerStats) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const capabilitiesOptions = runnerStats.config.capabilities['applause:options'];
        const dups = ApplauseReporter.getExplanationForConfigOptionsLoadedFromMultiplePlaces({ options: capabilitiesOptions, source: 'capabilities' }, { options: this.contructorPassedOptions, source: 'Reporter construction' });
        if (dups !== undefined) {
            throw new Error(`Differing configuration options detected: ${dups}`);
        }
        const mergedOptions = {
            ...capabilitiesOptions,
            ...this.contructorPassedOptions,
        };
        if (mergedOptions.baseUrl === undefined) {
            throw new Error('baseUrl is required');
        }
        if (mergedOptions.apiKey === undefined) {
            throw new Error('apiKey is required');
        }
        if (mergedOptions.productId === undefined) {
            throw new Error('productId is required');
        }
        this.autoapi = new AutoApi({
            clientConfig: {
                baseUrl: mergedOptions.baseUrl,
                apiKey: mergedOptions.apiKey,
            },
            productId: mergedOptions.productId,
        });
    }
    static getExplanationForConfigOptionsLoadedFromMultiplePlaces(...options) {
        const duplicateSources = ApplauseReporter.getDuplicates(options.map(option => option.source));
        if (duplicateSources.length > 0) {
            throw new Error(`duplicate options sources, please make sure all options sources are named with unique string. Duplicates: {${duplicateSources.join('\n')}}`);
        }
        // show the sources and values for this option if seen more than once
        // option name-> option values -> source
        const optionMap = {};
        options.flat(1).forEach(optionsObj => {
            Object.entries(optionsObj.options).forEach(entry => {
                const [optionName, optionValue] = entry;
                const optionValuesToSourcesMap = optionMap[optionName] === undefined ? {} : optionMap[optionName];
                optionValuesToSourcesMap[optionValue] = optionsObj.source;
                optionMap[optionName] = optionValuesToSourcesMap;
            });
        });
        // loop over all the option keys with more than one value
        const dups = Object.entries(optionMap)
            .filter(entry => Object.keys(entry[1]).length > 1)
            .map(entry => {
            const [optionName, optionValue] = entry;
            const innerStr = Object.entries(optionValue)
                .map(entry => {
                const [optionValue, optionSource] = entry;
                return `\t\tSet to '${optionValue}' in '${optionSource}'`;
            })
                .join('\n');
            return `Config Option '${optionName}' has multiple values! \n ${innerStr}`;
        })
            .join('\n');
        return dups.length > 0 ? dups : undefined;
    }
    /**
     * Courtesy of StackOverflow
     * @param objects list of strings to get duplicates from
     * @returns list of strings seen more than once
     */
    static getDuplicates(objects) {
        const instanceCounts = objects
            .map((name) => {
            return {
                count: 1,
                name: name
            };
        })
            .reduce((a, b) => {
            a[b.name] = (a[b.name] || 0) + b.count;
            return a;
        }, {});
        // grabs dups from counts
        return Object.keys(instanceCounts).filter((a) => instanceCounts[a] > 1);
    }
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats) {
        this.uidToResultIdMap[testStats.uid] = this.autoapi.startTestCase(testStats.title, browser.sessionId).then(res => {
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
    async onRunnerEnd(_stats) {
        const valuePromises = Object.values(this.uidToResultIdMap);
        let resultIds = [];
        await Promise.all(valuePromises)
            .then(vals => (resultIds = vals == null ? [] : vals))
            .catch(() => console.error('Unable to retrieve Applause TestResultIds'));
        const resp = await this.autoapi.getProviderSessionLinks(resultIds);
        const jsonArray = resp.data || [];
        if (jsonArray.length > 0) {
            console.info(JSON.stringify(jsonArray));
            // this is the wdio.conf outputDir
            const outputPath = _stats.config.outputDir || '.';
            writeFileSync(join(outputPath, 'providerUrls.txt'), JSON.stringify(jsonArray, null, 1));
        }
    }
}

export { ApplauseReporter };
//# sourceMappingURL=index.mjs.map
