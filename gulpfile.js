var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

var fs = require('fs');
var json = JSON.parse(fs.readFileSync('./package.json'));

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
var name = json.name + "-" + json.version;

var jsBuild = function() {
  return gulp.src(jsFiles)
             .pipe(concat('neo.js'))
             .pipe(gulp.dest(jsDest))
             .pipe(rename(name + '.js'))
             .pipe(gulp.dest(jsDest));
};

var cssBuild = function() {
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
  gulp.watch(jsFiles, gulp.series('scripts'));
  gulp.watch(cssFiles, gulp.series('scripts2'));
});
