var gulp       = require('gulp');
var gutil      = require('gulp-util');
var connect    = require('gulp-connect');
var gulpif     = require('gulp-if');
var coffee     = require('gulp-coffee');
var tplCache   = require('gulp-angular-templatecache');
var jade       = require('gulp-jade');
var less       = require('gulp-less');
var concat     = require('gulp-concat');
var browserify = require('gulp-browserify');
var watch      = require('gulp-watch');

gulp.task('appJS', function() {
  gulp.src('./app/app.js')
      .pipe(browserify({
          debug: true,
          transform: ['coffeeify'],
          extensions: ['.coffee']
      }))
      .pipe(gulp.dest('./build'))
});

gulp.task('testJS', function() {
  // Compile JS test files. Not compiled.
  gulp.src([
      './app/**/*_test.js',
      './app/**/*_test.coffee'
    ])
    .pipe(
      gulpif(/[.]coffee$/,
        coffee({bare: true})
        .on('error', gutil.log)
      )
    )
    .pipe(gulp.dest('./build'))
});

gulp.task('templates', function() {
  // combine compiled Jade and html template files into 
  // build/template.js
  gulp.src(['!./app/index.jade', '!./app/index.html',
      './app/**/*.html', './app/**/*.jade'])
      .pipe(gulpif(/[.]jade$/, jade().on('error', gutil.log)))
      .pipe(tplCache('templates.js',{standalone:true}))
      .pipe(gulp.dest('./build'))
});

gulp.task('appCSS', function() {
  // concatenate compiled Less and CSS
  // into build/app.css
  gulp
    .src([
      './app/**/*.less',
      './app/**/*.css'
    ])
    .pipe(
      gulpif(/[.]less$/,
        less({
          paths: [
            './bower_components/bootstrap/less'
          ]
        })
        .on('error', gutil.log))
    )
    .pipe(
      concat('app.css')
    )
    .pipe(
      gulp.dest('./build')
    )
});

gulp.task('index', function() {
  gulp.src(['./app/index.jade', './app/index.html'])
    .pipe(gulpif(/[.]jade$/, jade().on('error', gutil.log)))
    .pipe(gulp.dest('./build'));
});

gulp.task('watch',function() {

  // reload connect server on built file change
  watch({glob: 'build/**/*'}, function(files) {
      return files.pipe(connect.reload());
  });

  // watch files to build
  watch({glob: ['app/**/*.coffee', '!app/**/*_test.coffee', 'app/**/*.js', '!app/**/*_test.js']}, function() { gulp.start('appJS'); });
  watch({glob: ['app/**/*_test.coffee', 'app/**/*_test.js']}, function() { gulp.start('testJS'); });
  watch({glob: ['app/**/*.html', 'app/**/*.jade']}, function() { gulp.start('templates')});
  watch({glob: ['app/**/*.less', 'app/**/*.css']}, function() { gulp.start('appCSS'); });
  watch({glob: ['app/index.jade', 'app/index.html']}, function() { gulp.start('index'); });
});

gulp.task('connect', connect.server({
  root: ['build'],
  port: 9000,
  livereload: true
}));

gulp.task('default', ['connect', 'appJS', 'testJS', 'templates', 'appCSS', 'index', 'watch']);