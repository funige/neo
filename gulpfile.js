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

gulp.task('scripts', function() {
    return gulp.src(jsFiles)
        .pipe(concat('neo.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(gulp.dest('samplebbs'))
        .pipe(rename(name + '.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(gulp.dest('samplebbs'));
});

gulp.task('scripts2', function() {
    return gulp.src(cssFiles)
        .pipe(concat('neo.css'))
        .pipe(gulp.dest(jsDest))
        .pipe(gulp.dest('samplebbs'))
        .pipe(rename(name + '.css'))
        .pipe(gulp.dest(jsDest))
        .pipe(gulp.dest('samplebbs'));
});

gulp.task('default', function() {
    gulp.watch(jsFiles, ['scripts']);
    gulp.watch(cssFiles, ['scripts2']);
});
