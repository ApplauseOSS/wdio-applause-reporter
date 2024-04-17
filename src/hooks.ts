import { Capabilities, Services, Frameworks, Options } from "@wdio/types";

export class ApplauseService implements Services.ServiceInstance {
    private browser: WebdriverIO.Browser | undefined;

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
    // @ts-ignore
        constructor (serviceOptions: Services.ServiceOption, capabilities: Capabilities.RemoteCapability, config: Omit<Options.WebdriverIO, 'capabilities'>) {}
    
        /**
         * this browser object is passed in here for the first time
         */
        // @ts-ignore
        async before(capabilities: Capabilities.RemoteCapability,  specs: string[], browser: WebdriverIO.Browser) {
            this.browser = browser
        }
    
        // @ts-ignore
        async afterTest(test: Frameworks.Test, context: any, result: Frameworks.TestResult) {
            if(this.browser == undefined) {
                return;
            }
            console.log("After Test Hook!")
            if (!result.passed) {
                // @ts-ignore
                process.emit('applause:screenshot', {
                    testCase: test.fullName,
                    retryNum: test._currentRetry,
                    content: Buffer.from(await this.browser.takeScreenshot(), 'base64')
                });
            }
        }

}