import WDIOReporter, { TestStats, RunnerStats } from '@wdio/reporter';
import { TestRailOptions } from 'auto-api-client-js';

/**
 * Custom Applause reporter configuration
 */
interface ApplauseOptions extends Partial<WebdriverIO.ReporterOption> {
    /**
     * The base URL for Applause Automation Service
     */
    baseUrl: string;
    /**
     * Your API Key
     */
    apiKey: string;
    /**
     * The product you're testing
     */
    productId: number;
    /**
     * TestRail options
     */
    testRail: TestRailOptions;
}

declare class ApplauseReporter extends WDIOReporter {
    private autoapi;
    private uidToResultIdMap;
    private resultSubmissionMap;
    private testRunId;
    private isEnded;
    private sdkHeartbeat?;
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised(): boolean;
    constructor(options: ApplauseOptions);
    onRunnerStart(): Promise<void>;
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats: TestStats): void;
    onTestPass(test: TestStats): void;
    onTestFail(test: TestStats): void;
    onTestRetry(test: TestStats): void;
    onTestSkip(test: TestStats): void;
    onRunnerEnd(_stats: RunnerStats): Promise<void>;
}

export { ApplauseOptions, ApplauseReporter };
