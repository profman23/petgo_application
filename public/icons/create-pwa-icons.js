import fs from 'fs';

// Create SVG icons with white background
const createIcon = (size, filename) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="white" rx="${size * 0.125}" ry="${size * 0.125}"/>
  
  <!-- Original logo image -->
  <image x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" 
         href="/icons/original-logo.png" 
         preserveAspectRatio="xMidYMid meet"/>
</svg>`;
  
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename} (${size}x${size})`);
};

// Create all required PWA icon sizes
const iconSizes = [
  { size: 72, name: 'icon-72x72.svg' },
  { size: 96, name: 'icon-96x96.svg' },
  { size: 128, name: 'icon-128x128.svg' },
  { size: 144, name: 'icon-144x144.svg' },
  { size: 152, name: 'icon-152x152.svg' },
  { size: 192, name: 'icon-192x192.svg' },
  { size: 384, name: 'icon-384x384.svg' },
  { size: 512, name: 'icon-512x512.svg' }
];

iconSizes.forEach(icon => {
  createIcon(icon.size, icon.name);
});

console.log('All PWA icons created successfully!');