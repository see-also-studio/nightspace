const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageResize = require('gulp-image-resize');
const rename = require('gulp-rename');

gulp.task('default', () => {
  
//   specify different image sizes
  const sizes = [
    { width: 320, quality: 80, suffix: '320' },
    { width: 640, quality: 80, suffix: '640' },
    { width: 768, quality: 80, suffix: '768' },
    { width: 1024, quality: 80, suffix: '1024' },
    { width: 1366, quality: 80, suffix: '1366' },
    { width: 1600, quality: 80, suffix: '1600' },
  ];
  let stream;
  sizes.forEach((size) => {
    stream = gulp
//     source for images to optimize
      .src('assets/**/*.{jpg,jpeg,png,gif}')
//     resize image
      .pipe(imageResize({ 
        width: size.width,
        height: size.width,
        imageMagick: true,
        upscale: false,
      }))
//       add suffix to image
      .pipe(
        rename((path) => {
          path.basename += `-${size.suffix}`;
        }),
      )
//     reduce image quality based on the size
      .pipe(
        imagemin(
          [
            imageminMozjpeg({
              quality: size.quality,
            }),
          ],
          {
            verbose: true,
          },
        ),
      )
//     output optimized images to a destination folder
      .pipe(gulp.dest('dist-images/'));
  });
  return stream;
});
