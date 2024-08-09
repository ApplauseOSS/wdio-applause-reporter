# Webdriver.IO reporter for Applause Automation
Written in TypeScript, transpiled to JS for NPM packaging using Rollup

creates NPM package in /dist folder in ES, UMD, and CJS module formats

also publishes Typescript types and sourcemaps into NPM package

runs tests using Node and UVU

Configured for Node 14+ . To update, change base tsconfig from "extends": "@tsconfig/node14/tsconfig.json", update "engines" section in package.json, and update .node-version file

# Usage

## Configuration Setup

## Configuration Setup

To set up the `applause.json` config file for the WebdriverIO tests, follow these steps:

1. Create a new file named `applause.json` in the root directory of your project.

2. Open the `applause.json` file and add the following JSON structure:

```json
{
    "apiKey": "API_KEY",
    "productId": 0,
    "applauseTestCycleId": 0,
    "testRailOptions": {
        "projectId": 0,
        "suiteId": 0,
        "planName": "Example Plan Name",
        "runName": "Example Run Name"
    }
}
```

The `apiKey` and `productId` settings are required for execution. The `testRailOptions` and `applauseTestCycleId` settings are optional.

3. Save the `applause.json` file.

Now, when you run your WebdriverIO tests, they will be configured to use the settings specified in the `applause.json` file.

## Applause Automation Reporting

To use the `ApplauseRunService` and `ApplauseResultService` in a WebdriverIO configuration file, follow these steps:

1. Install the `wdio-applause-reporter` package as a dev dependency by running the command: `npm install wdio-applause-reporter --save-dev`.

2. Import the `ApplauseRunService` and `ApplauseResultService` classes in your WebdriverIO configuration file:

```javascript
import { ApplauseRunService, ApplauseResultService } frpom 'wdio-applause-reporter';
```

3. Add the `ApplauseRunService` and `ApplauseResultService` to the `services` array in your WebdriverIO configuration file:

```javascript
exports.config = {
    // ... other configuration options

    services: [
        // ... other services
        [ApplauseRunService, {}],
        [ApplauseResultService, {}]
    ],

    // ... other configuration options
};
```

4. Run your WebdriverIO tests as usual. The `ApplauseRunService` will handle setting up the Applause TestRun the `ApplauseResultService` will handle the reporting.

## Applause Platform Reporting

To use the `ApplausePlatformReporter` in the reporter section of a WebdriverIO configuration file, follow these steps:

1. Install the `wdio-applause-reporter` package as a dev dependency by running the command: `npm install wdio-applause-reporter --save-dev`.

2. Import the `ApplausePlatformReporter` class in your WebdriverIO configuration file:

```javascript
import { ApplausePlatformReporter } from 'wdio-applause-reporter';
```

3. Add the `ApplausePlatformReporter` to the `reporters` array in your WebdriverIO configuration file:

```javascript
exports.config = {
    // ... other configuration options

    reporters: [
        // ... other reporters
        [ApplausePlatformReporter, {}]
    ],

    // ... other configuration options
};
```

4. Run your WebdriverIO tests as usual. The `ApplausePlatformReporter` will handle reporting to the Applause Platform.

## Winston Logger Configurations

To insert a custom Winston logger into the `ApplausePlatformReporter`, `ApplauseRunService`, and `ApplauseResultService`, you can follow these steps:

1. Create a custom Winston logger configuration in your WebdriverIO configuration file. You can use the `winston` package to create and configure your logger. Here's an example:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ]
});
```

2. Pass the custom logger to the respective services and reporter by adding the `logger` option to their configuration. Here's an example:

```javascript
exports.config = {
    // ... other configuration options

    services: [
        // ... other services
        [ApplauseRunService, {
            logger: logger
        }],
        [ApplauseResultService, {
            logger: logger
        }]
    ],

    reporters: [
        // ... other reporters
        [ApplausePlatformReporter, {
            logger: logger
        }]
    ],

    // ... other configuration options
};
```

By providing the `logger` option with your custom logger, you can integrate it into the `ApplausePlatformReporter`, `ApplauseRunService`, and `ApplauseResultService` for logging purposes.

To insert a custom Winston logger into the `ApplausePlatformReporter`, `ApplauseRunService`, and `ApplauseResultService`, you can follow these steps:

1. Create a custom Winston logger configuration in your WebdriverIO configuration file. You can use the `winston` package to create and configure your logger. Here's an example:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new ApplauseTransport(),
    ]
});
```

2. Pass the custom logger to the respective services and reporter by adding the `logger` option to their configuration. Here's an example:

```javascript
exports.config = {
    // ... other configuration options

    services: [
        // ... other services
        [ApplauseRunService, {
            logger: logger
        }],
        [ApplauseResultService, {
            logger: logger
        }]
    ],

    reporters: [
        // ... other reporters
        [ApplausePlatformReporter, {
            logger: logger
        }]
    ],

    // ... other configuration options
};
```

By providing the `logger` option with your custom logger, you can integrate it into the `ApplausePlatformReporter`, `ApplauseRunService`, and `ApplauseResultService` for logging purposes.


# Developing 
Use `yarn run all` . It will configure and run all the build steps

## Setup

To set up the project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory: `/Users/rconner/src/wdio-applause-reporter/`.
3. Install the project dependencies by running the command: `yarn install`.
4. Build the project by running: `yarn build`.
5. Run the tests using: `yarn test`.
6. Clean the project by running: `yarn clean`.
7. Lint the code with: `yarn lint`.

Make sure you have Node.js 14+ installed and configured before proceeding with these steps.
