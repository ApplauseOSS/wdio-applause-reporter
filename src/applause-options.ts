/**
 * Custom Applause reporter configuration
 */
export interface ApplauseOptions {
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
