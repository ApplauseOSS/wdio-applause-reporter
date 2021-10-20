import WDIOReporter, { TestStats } from '@wdio/reporter';
import { Reporters } from '@wdio/types';

/**
 * Custom Applause reporter configuration
 */
interface ApplauseOptions {
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
    private readonly autoapi;
    private uidToResultIdMap;
    /**
     * overwrite isSynchronised method
     */
    get isSynchronised(): boolean;
    constructor(optionsIn: Partial<Reporters.Options> & ApplauseOptions);
    /** This start method CANNOT be async. We need to get the resultId UID mapping promise started before any other hooks run for each test */
    onTestStart(testStats: TestStats): void;
    onTestPass(test: TestStats): Promise<void>;
    onTestFail(test: TestStats): Promise<void>;
    onTestRetry(test: TestStats): Promise<void>;
    onTestSkip(test: TestStats): Promise<void>;
}

export { ApplauseOptions, ApplauseReporter };
