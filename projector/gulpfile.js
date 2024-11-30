var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var gutil = require("gulp-util");

var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

var jasmineBrowser = require('gulp-jasmine-browser');

//var watch = require('gulp-watch');

//var gulp = require('gulp');
//var jasmineBrowser = require('gulp-jasmine-browser');






var paths = {
    pages: ['src/*.html']
};

var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['src/main.tsx'],
    cache: {},
    packageCache: {}
}).plugin(tsify));

gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("dist"));
});

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('bundle.js'))

        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(uglify())
        .pipe(sourcemaps.write('./'))

        .pipe(gulp.dest("dist"));
}

gulp.task("default", ["copy-html"], bundle);
watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);


// var watchedBrowserifyTests = watchify(browserify({
//     basedir: '.',
//     debug: true,
//     entries: ['spec/utils.spec.ts', 'spec/guidmap.spec.ts'], // ['spec/**/*_spec.ts'],
//     cache: {},
//     packageCache: {}
// }).plugin(tsify));

// function bundleTests() {
//     //return gulp.src(['spec/**/*_spec.ts'])
//         //.pipe(watchedBrowserifyTests)
//     return watchedBrowserifyTests
//         .bundle()
//         .pipe(source('bundleTest.js'))

//         .pipe(buffer())
//          .pipe(sourcemaps.init({loadMaps: true}))
//         // // .pipe(uglify())
//          .pipe(sourcemaps.write('./'))

//         .pipe(gulp.dest("dist"));
//         // //.pipe(source('dist/bundleTest.js'))
//         // .pipe(jasmineBrowser.specRunner())
//         // .pipe(jasmineBrowser.server({port: 8888}));
// }

// // gulp.task('jasmine', ["default"], function() {
// //   return gulp.src(['dist/bundleTest.js'])
// //     .pipe(jasmineBrowser.specRunner())
// //     .pipe(jasmineBrowser.server({port: 8888}));
// // });

// gulp.task("test-old", ["default"], bundleTests);
// watchedBrowserifyTests.on("update", bundleTests);
// watchedBrowserifyTests.on("log", gutil.log);



// gulp.task('test', function() {
//     //var filesForTest = ['src/**/*.js', 'spec/**/*_spec.js'];
//     var filesForTest = ['dist/bundleTest.js'];
//     return gulp.src(filesForTest)
//         .pipe(watch(filesForTest))
//         .pipe(jasmineBrowser.specRunner())
//         .pipe(gulp.dest("dist"));
//         //.pipe(jasmineBrowser.server({port: 8888, }));
// });