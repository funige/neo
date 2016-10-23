var gulp = require('gulp');
var concat = require('gulp-concat');

var jsFiles = ["neo.js", 
               "assets/painter.js",
               "assets/tools.js",
               "assets/commands.js",
               "assets/widgets.js"];
var jsDest = "dist";

gulp.task('scripts', function() {
    return gulp.src(jsFiles)
            .pipe(concat('scripts.js'))
            .pipe(gulp.dest(jsDest));
});

gulp.task('default', function() {
    gulp.watch(jsFiles, ['scripts']);
});
