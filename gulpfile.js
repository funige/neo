var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

var fs = require('fs');

var tsFiles = ["src/container.ts",
               "src/dictionary.ts",
               "src/painter.ts",
               "src/tools.ts",
               "src/commands.ts",
               "src/actions.ts",
               "src/widgets.ts",
               "src/lz-string.ts"];
var jsDest = "dist";
var cssFiles = ["src/neo.css"]

var jsBuild = function(done) {
  require("child_process").execFileSync("pnpm", ["exec", "tsc", "--project", "tsconfig.json"]);
  var json = JSON.parse(fs.readFileSync('./package.json'));
  var name = json.name + "-" + json.version;
  fs.writeFileSync(jsDest + "/neo.js", fs.readFileSync(jsDest + "/neo.js", "utf8").replace(/PACKAGE_JSON_VERSION/g, json.version));
  fs.copyFileSync(jsDest + "/neo.js", jsDest + "/" + name + ".js");
  done();
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
  gulp.watch([...tsFiles, "package.json", "tsconfig.json"], gulp.series('scripts'));
  gulp.watch([...cssFiles, "package.json"], gulp.series('scripts2'));
});
