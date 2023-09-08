import { TestRailOptions } from "auto-api-client-js";
/**
 * Custom Applause reporter configuration
 */
export interface ApplauseOptions extends Partial<WebdriverIO.ReporterOption> {
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
//# sourceMappingURL=applause-options.d.ts.map