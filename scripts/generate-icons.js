// Generate PWA icons from the new VetsVan logo
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a simple SVG icon based on the logo description
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#852085;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Medical cross background -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  
  <!-- Cross shape -->
  <rect x="${size * 0.35}" y="${size * 0.15}" width="${size * 0.3}" height="${size * 0.7}" fill="white" rx="${size * 0.05}"/>
  <rect x="${size * 0.15}" y="${size * 0.35}" width="${size * 0.7}" height="${size * 0.3}" fill="white" rx="${size * 0.05}"/>
  
  <!-- Pet silhouettes -->
  <g fill="#852085" opacity="0.8">
    <!-- Dog silhouette -->
    <ellipse cx="${size * 0.35}" cy="${size * 0.45}" rx="${size * 0.08}" ry="${size * 0.12}"/>
    <ellipse cx="${size * 0.4}" cy="${size * 0.38}" rx="${size * 0.06}" ry="${size * 0.08}"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.35}" rx="${size * 0.03}" ry="${size * 0.04}"/>
    
    <!-- Cat silhouette -->
    <ellipse cx="${size * 0.65}" cy="${size * 0.55}" rx="${size * 0.07}" ry="${size * 0.1}"/>
    <ellipse cx="${size * 0.6}" cy="${size * 0.48}" rx="${size * 0.05}" ry="${size * 0.07}"/>
    <ellipse cx="${size * 0.58}" cy="${size * 0.42}" rx="${size * 0.02}" ry="${size * 0.03}"/>
    <ellipse cx="${size * 0.62}" cy="${size * 0.42}" rx="${size * 0.02}" ry="${size * 0.03}"/>
  </g>
</svg>`;
};

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Generated ${filename}`);
});

console.log('All PWA icons generated successfully!');