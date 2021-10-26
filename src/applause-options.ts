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
}
