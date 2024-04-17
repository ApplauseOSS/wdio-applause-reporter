import { Services, Capabilities, Options, Frameworks } from '@wdio/types';

declare class ApplauseService implements Services.ServiceInstance {
    private browser;
    /**
 * `serviceOptions` contains all options specific to the service
 * e.g. if defined as follows:
 *
 * ```
 * services: [['custom', { foo: 'bar' }]]
 * ```
 *
 * the `serviceOptions` parameter will be: `{ foo: 'bar' }`
 */
    constructor(serviceOptions: Services.ServiceOption, capabilities: Capabilities.RemoteCapability, config: Omit<Options.WebdriverIO, 'capabilities'>);
    /**
     * this browser object is passed in here for the first time
     */
    before(capabilities: Capabilities.RemoteCapability, specs: string[], browser: WebdriverIO.Browser): Promise<void>;
    afterTest(test: Frameworks.Test, context: any, result: Frameworks.TestResult): Promise<void>;
}

export { ApplauseService };
