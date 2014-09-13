# AngularJS for Professional Programmers - Sample App

## Software required

1. Node and npm (http://nodejs.org/)
1. Git
1. Chrome

## Setup

1. `git clone git@github.com:deviowa/bongo-sample-app.git`
1. `cd bongo-sample-app`
1. `npm install`

You can confirm you are set up by running `npm run dev`. If you don't get any errors, you're set!

## Develop

There are three main tools included in the repo - a compiler, a unit test runner, and an end-to-end (e2e) test runner.

### Run source code

`npm run dev`

The compiler will start and watch for any template, css, or javascript changes.
This command also automatically opens a new chrome tab that will refresh whenever you make
code changes.

### Run unit tests (continuously)

`npm run unit`

The tests will keep running as you make changes to your code. I reserve a whole shell window for this.


### Run e2e tests (once)

`npm run e2e`

The tests will run in chrome by default, though webdriver-manager can be used to run them in whatever browser you like.
They just run once per invocation.