// Karma configuration
// Generated on Thu Sep 28 2017 19:01:32 GMT+0200 (Central Europe Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'karma-typescript'],

    karmaTypescriptConfig: { 
      coverageOptions: { 
        //instrumentation: false 
      }
    },

    // list of files / patterns to load in the browser
    files: [

      'src/**/*.ts',
      'spec/**/*.spec.ts'
    ],


    // list of files to exclude
    exclude: [
      'src/main.tsx'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.ts': ['karma-typescript']
    },

    // typescriptPreprocessor: {
    //   // options passed to the typescript compiler 
    //   options: {
    //     sourceMap: false, // (optional) Generates corresponding .map file. 
    //     target: 'ES5', // (optional) Specify ECMAScript target version: 'ES3' (default), or 'ES5' 
    //     module: 'amd', // (optional) Specify module code generation: 'commonjs' or 'amd' 
    //     noImplicitAny: true, // (optional) Warn on expressions and declarations with an implied 'any' type. 
    //     noResolve: true, // (optional) Skip resolution and preprocessing. 
    //     removeComments: true, // (optional) Do not emit comments to output. 
    //     concatenateOutput: false // (optional) Concatenate and emit output to single file. By default true if module option is omited, otherwise false. 
    //   },
    //   // transforming the filenames 
    //   transformPath: function(path) {
    //     return path.replace(/\.ts$/, '.js');
    //   }
    // },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'karma-typescript'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
