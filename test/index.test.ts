import nock from 'nock';
import { ApplauseResultService, ApplauseRunService } from '../src/index.ts';
import { Frameworks } from '@wdio/types';
import { CreateTestCaseResultResponseDto, TestRunCreateResponseDto } from 'applause-reporter-common';

jest.mock('applause-reporter-common', () => {
    const originalModule = jest.requireActual('applause-reporter-common');
    return {
    ...originalModule,
    TestRunHeartbeatService: jest.fn().mockImplementation(() => {
        return {
        start: jest.fn(),
        stop: jest.fn(),
        };
    }),
    };
});

describe("index tests", () => {

    let runService: ApplauseRunService;
    let resultService: ApplauseResultService;
    let lastValue: any;

    beforeEach(async () => {
        nock('http://auto-api')
            .delete('/api/v1.0/test-run/1?endingStatus=COMPLETE').reply(200)
            .post('/api/v1.0/test-run/create').reply(200, { runId: 1 } as TestRunCreateResponseDto)
            .post('/api/v1.0/test-result/create-result').reply(200, { testResultId: 1} as CreateTestCaseResultResponseDto)
            .post('/api/v2.0/sdk-heartbeat').reply(200)
            .post('/api/v1.0/test-result/1/upload').reply(200)
            .post('/api/v1.0/test-result', (body) => { lastValue = body; return true; })
                .reply(200)
            .post('/api/v1.0/test-result/provider-info').reply(200, []);
        runService = new ApplauseRunService({
            properties: {
                autoApiBaseUrl: 'http://auto-api',
                apiKey: 'abc',
                productId: 123,
            }
        });
        await runService.onPrepare();
        resultService = new ApplauseResultService({
            properties: {
                autoApiBaseUrl: 'http://auto-api',
                apiKey: 'abc',
                productId: 123,
            }
        });
        global.browser = { sessionId: '123', takeScreenshot: async () => "", getPageSource: async () => "" } as any;
    }, 10000);

    afterEach(async () => {
        await runService.onComplete();
        process.env = {};
        nock.cleanAll();
    }, 10000);

    it('should pick up the correct message from the error', async () => {
        await resultService.beforeTest({
            fullName: 'test',
        } as Frameworks.Test)
        await resultService.afterTest({
                fullName: 'test',
            } as Frameworks.Test, 
            {},
            { passed: false, error: new Error("Something failed")} as Frameworks.TestResult)
        expect(lastValue?.failureReason).toEqual("Something failed");
    });

    it('should not have an error message for passed runs', async () => {
        await resultService.beforeTest({
            fullName: 'test',
        } as Frameworks.Test)
        await resultService.afterTest({
                fullName: 'test',
            } as Frameworks.Test, 
            {},
            { passed: true } as Frameworks.TestResult)
        expect(lastValue?.failureReason).toBeUndefined();
    });
});