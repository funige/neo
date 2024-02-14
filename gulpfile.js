var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

var fs = require('fs');

var jsFiles = ["src/container.js",
               "src/dictionary.js",
               "src/painter.js",
               "src/tools.js",
               "src/commands.js",
               "src/actions.js",
               "src/widgets.js",
               "src/lz-string.js"];
var jsDest = "dist";
var cssFiles = ["src/neo.css"]

var jsBuild = function() {
  var json = JSON.parse(fs.readFileSync('./package.json'));
  var name = json.name + "-" + json.version;
  return gulp.src(jsFiles)
             .pipe(concat('neo.js'))
             .pipe(replace(/PACKAGE_JSON_VERSION/g, json.version))
             .pipe(gulp.dest(jsDest))
             .pipe(rename(name + '.js'))
             .pipe(gulp.dest(jsDest));
};

var cssBuild = function() {
  var json = JSON.parse(fs.readFileSync('./package.json'));
  var name = json.name + "-" + json.version;
  return gulp.src(cssFiles)
             .pipe(concat('neo.css'))
             .pipe(gulp.dest(jsDest))
             .pipe(rename(name + '.css'))
             .pipe(gulp.dest(jsDest));
};

gulp.task('scripts', jsBuild);
gulp.task('scripts2', cssBuild);

gulp.task('default', function() {
  jsBuild();
  cssBuild();
  gulp.watch([...jsFiles, "package.json"], gulp.series('scripts'));
  gulp.watch([...cssFiles, "package.json"], gulp.series('scripts2'));
});
