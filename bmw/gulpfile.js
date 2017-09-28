var gulp = require('gulp');

var gutil = require('gulp-util');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var browserSync = require('browser-sync');

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: 'dist'
        },
    })
});

gulp.task('sass', function() {
    gulp.src('app/scss/**/*.scss')
        .pipe(sass().on('error', gutil.log))
        .pipe(prefix({
            browsers: ['last 2 version', 'safari 5', 'ie 6', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('watch', ['browserSync', 'sass'], function (){
    gulp.watch('app/scss/**/*.scss', ['sass']);
    // Обновляем браузер при любых изменениях в HTML или JS
    gulp.watch('dist/*.html', browserSync.reload);
    gulp.watch('dist/js/**/*.js', browserSync.reload);
});

