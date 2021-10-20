# Webdriver.IO reporter for Applause Automation
Written in TypeScript, transpiled to JS for NPM packaging using Rollup

creates NPM package in /dist folder in ES, UMD, and CJS module formats

also publishes Typescript types and sourcemaps into NPM package

runs tests using Node and UVU

Configured for Node 14+ . To update, change base tsconfig from "extends": "@tsconfig/node14/tsconfig.json", update "engines" section in package.json, and update .node-version file

# Running 
Use `yarn run all` . It will configure and run all the build steps

## Setup

`yarn install`

### build

`yarn build`

### test

`yarn test`

### clean

`yarn clean`

### lint

`yarn lint`

## Publishing

`yarn publish`
