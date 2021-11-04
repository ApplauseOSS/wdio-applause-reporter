import WDIOReporter, { RunnerStats, TestStats } from '@wdio/reporter';

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
}

declare class ApplauseReporter extends WDIOReporter {
    private autoapi?;
    private readonly contructorPassedOptions;
    private uidToResultIdMap;
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised(): boolean;
    constructor(optionsIn: Partial<ApplauseOptions>);
    onRunnerStart(runnerStats: RunnerStats): void;
    static getExplanationForConfigOptionsLoadedFromMultiplePlaces(...options: {
        options: Record<string | number, string>;
        source: string;
    }[]): string | undefined;
    /**
     * Courtesy of StackOverflow
     * @param objects list of strings to get duplicates from
     * @returns list of strings seen more than once
     */
    static getDuplicates(objects: string[]): string[];
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats: TestStats): void;
    onTestPass(test: TestStats): Promise<void>;
    onTestFail(test: TestStats): Promise<void>;
    onTestRetry(test: TestStats): Promise<void>;
    onTestSkip(test: TestStats): Promise<void>;
    onRunnerEnd(_stats: RunnerStats): Promise<void>;
}

export { ApplauseOptions, ApplauseReporter };
