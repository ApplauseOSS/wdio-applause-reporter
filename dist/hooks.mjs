class ApplauseService {
    browser;
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
    constructor(serviceOptions, capabilities, config) { }
    /**
     * this browser object is passed in here for the first time
     */
    // @ts-ignore
    async before(capabilities, specs, browser) {
        this.browser = browser;
    }
    // @ts-ignore
    async afterTest(test, context, result) {
        if (this.browser == undefined) {
            return;
        }
        console.log("After Test Hook!");
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

export { ApplauseService };
//# sourceMappingURL=hooks.mjs.map
