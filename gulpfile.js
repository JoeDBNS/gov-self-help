var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', function() {
  return gulp.src('./src/scss/main.scss')
    .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({overrideBrowserslist: ['last 2 versions', '> 1%', 'Firefox ESR', 'not ie <= 8']}))
    .pipe(gulp.dest('./static/css'));
});

gulp.task('watch', function() {
  gulp.watch('./src/scss/**/*.scss', ['sass']);
});

gulp.task('default', ['sass']);
