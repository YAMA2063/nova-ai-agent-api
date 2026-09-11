const Jimp = require('jimp');
const path = require('path');

const inputPath = 'C:\\Users\\MyBook Hype AMD\\Downloads\\nova logo.png';
const outputPath = path.join(__dirname, 'apps', 'web', 'public', 'nova logo.png');

Jimp.read(inputPath)
  .then(image => {
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is completely black or very close to black
      if (red < 20 && green < 20 && blue < 20) {
        // Set alpha to 0 (transparent)
        this.bitmap.data[idx + 3] = 0;
      }
    });
    
    return image.writeAsync(outputPath);
  })
  .then(() => {
    console.log('Background removed successfully and saved to:', outputPath);
  })
  .catch(err => {
    console.error('Error processing image:', err);
  });
