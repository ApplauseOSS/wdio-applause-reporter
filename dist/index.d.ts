import WDIOReporter, { TestStats } from '@wdio/reporter';
import { ApplauseConfig } from 'applause-reporter-common';
export { ApplauseConfig } from 'applause-reporter-common';

declare class ApplauseWdioReporter extends WDIOReporter {
    private reporter;
    constructor(options: Partial<ApplauseConfig>);
    onRunnerStart(): void;
    onTestStart(testStats: TestStats): void;
    onTestPass(test: TestStats): void;
    onTestFail(test: TestStats): void;
    onTestRetry(test: TestStats): void;
    onTestSkip(test: TestStats): void;
    onRunnerEnd(): Promise<void>;
    get isSynchronised(): boolean;
}

export { ApplauseWdioReporter };
