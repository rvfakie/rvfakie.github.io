var gulp = require('gulp');

var historyApiFallback = require('connect-history-api-fallback');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var browserSync = require('browser-sync');

gulp.task('sass', function() {
    gulp.src('precompile/assets/stylesheets/*.scss')
        .pipe(sass().on('error', gutil.log))
        .pipe(prefix({
            browsers: ['last 2 version', 'safari 5', 'ie 6', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']
        }))
        .pipe(gulp.dest('application/assets/stylesheets'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('serve', function () {
    browserSync.init(null, {
        server: {
            baseDir: "./",
            middleware: [ historyApiFallback() ]
        }
    });

    gulp.watch('precompile/assets/stylesheets/*.scss', ['sass']);
    gulp.watch('**/*.html', browserSync.reload);
    gulp.watch('**/*.js', browserSync.reload);
});

