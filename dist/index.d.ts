import WDIOReporter, { TestStats } from '@wdio/reporter';
import { Services, Frameworks } from '@wdio/types';
import { ApplauseReporter, ApplauseConfig } from 'applause-reporter-common';
import * as winston from 'winston';

declare class ApplauseRunService implements Services.ServiceInstance {
    reporter: ApplauseReporter;
    logger: winston.Logger;
    constructor(serviceOptions: Services.ServiceOption);
    onPrepare(): Promise<void>;
    onComplete(): Promise<void>;
}
declare class ApplauseResultService implements Services.ServiceInstance {
    reporter: ApplauseReporter;
    logger: winston.Logger;
    activeTest?: string;
    constructor(serviceOptions: Services.ServiceOption);
    /**
     * Before test hook. This is called for tests executed by the Mocha or Jasmine framework. See beforeScenario for
     * execution of Cucumber tests.
     *
     * @param test The test object
     */
    beforeTest(test: Frameworks.Test): Promise<void>;
    /**
     * The beforeScenario hook is called before each scenario in a Cucumber test.
     *
     * @param world The cucumber world object
     */
    beforeScenario(world: Frameworks.World): Promise<void>;
    afterCommand(commandName: string, args: unknown[], result: unknown): Promise<void>;
    /**
     * The afterTest hook is called after each test in a Mocha or Jasmine test.
     *
     * @param test The test object
     * @param _context The context object
     * @param result The result object
     */
    afterTest(test: Frameworks.Test, _context: unknown, result: Frameworks.TestResult): Promise<void>;
    /**
     * The afterScenario hook is called after each scenario in a Cucumber test.
     *
     * @param world The cucumber world object
     * @param result The result object
     */
    afterScenario(world: Frameworks.World, result: Frameworks.TestResult): Promise<void>;
    /**
     * Function to lookup the title from a Test or World object. WebdriverIO is inconsistent with where the title is stored. In some
     * cases it is in the `fullName` property, in others it is in the `fullTitle` property, and in others it is in the `title` property.
     * For cucumber, it is stored in the `pickle.name` property. If none of these are found, it will return '<Unknown Test>'.
     *
     * @param test The test or world object
     * @returns The title of the test
     */
    private lookupTitle;
    /**
     * Function to capture assets for a test case. This includes a screenshot, page source, and console log. If the test case failed,
     * the failure screenshot will be attached to the test case.
     *
     * @param resultId The result ID of the test case
     * @param passed Whether the test case passed
     */
    private captureAssets;
}
declare class ApplausePlatformWdioReporter extends WDIOReporter {
    private publciApi;
    private config;
    private inflightCalls;
    private logger;
    constructor(options: Partial<ApplauseConfig & {
        logger: winston.Logger;
    }>);
    onTestPass(test: TestStats): void;
    onTestFail(test: TestStats): void;
    onTestSkip(test: TestStats): void;
    onRunnerEnd(): Promise<void>;
    get isSynchronised(): boolean;
}

export { ApplausePlatformWdioReporter, ApplauseResultService, ApplauseRunService };
