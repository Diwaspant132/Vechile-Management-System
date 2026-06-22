const sharp = require('sharp');

async function processImage() {
  try {
    // Generate 512x512
    await sharp('public/ntc-logo.png')
      .resize(512, 512, { 
        fit: 'contain', 
        background: { r: 0, g: 74, b: 153, alpha: 1 } // #004A99
      })
      .toFile('public/pwa-512x512.png');
      
    // Generate 192x192
    await sharp('public/ntc-logo.png')
      .resize(192, 192, { 
        fit: 'contain', 
        background: { r: 0, g: 74, b: 153, alpha: 1 } // #004A99
      })
      .toFile('public/pwa-192x192.png');
      
    console.log('Successfully generated perfectly square PWA icons!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

processImage();
