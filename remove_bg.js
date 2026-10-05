const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function processImages() {
  const avatars = ['avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg'];
  const inDir = path.join(__dirname, 'public/assets/avatars');
  const outDir = path.join(__dirname, 'public/assets/avatars');

  for (const file of avatars) {
    const inputPath = path.join(inDir, file);
    const fileUri = 'file:///' + inputPath.replace(/\\/g, '/');
    const outputPath = path.join(outDir, file.replace('.jpg', '.png'));
    
    console.log(`Processing ${file}...`);
    try {
      const blob = await removeBackground(fileUri);
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved ${outputPath}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

processImages();
