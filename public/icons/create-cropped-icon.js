// Node.js script to create cropped VetsVan icons
const fs = require('fs');

// Create SVG content for cropped icon
function createCroppedIconSVG(size) {
    const cropWidth = size * 0.75; // 75% width to show cropping effect
    const cropX = (size - cropWidth) / 2;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#852085;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#a855f7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
    <clipPath id="cropSides">
      <rect x="${cropX}" y="0" width="${cropWidth}" height="${size}"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
  
  <!-- Cropped logo container -->
  <g clip-path="url(#cropSides)">
    <!-- VetsVan Logo scaled to fill and appear cropped -->
    <g transform="translate(${-size * 0.1}, ${size * 0.15}) scale(${size / 400})">
      <!-- Van Shape -->
      <rect x="80" y="100" width="240" height="100" rx="12" fill="white" opacity="0.95"/>
      <rect x="70" y="110" width="15" height="80" rx="8" fill="white" opacity="0.9"/>
      <rect x="315" y="110" width="15" height="80" rx="8" fill="white" opacity="0.9"/>
      
      <!-- VETS VAN Text -->
      <text x="200" y="135" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
            text-anchor="middle" fill="#852085">VETS</text>
      <text x="200" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            text-anchor="middle" fill="#7c3aed">VAN</text>
      
      <!-- Pet silhouettes -->
      <circle cx="130" cy="140" r="10" fill="#852085"/>
      <circle cx="130" cy="136" r="6" fill="white"/>
      <circle cx="270" cy="140" r="10" fill="#852085"/>
      <path d="M266 136 L270 132 L274 136 L271 141 L269 141 Z" fill="white"/>
      
      <!-- Medical cross -->
      <rect x="196" y="170" width="8" height="16" fill="#852085"/>
      <rect x="192" y="174" width="16" height="8" fill="#852085"/>
      
      <!-- Additional van details for realism -->
      <rect x="90" y="115" width="4" height="70" fill="#852085" opacity="0.3"/>
      <rect x="306" y="115" width="4" height="70" fill="#852085" opacity="0.3"/>
    </g>
  </g>
  
  <!-- Fade effect on sides to enhance cropping -->
  <rect x="0" y="0" width="${cropX}" height="${size}" fill="black" opacity="0.15"/>
  <rect x="${size - cropX}" y="0" width="${cropX}" height="${size}" fill="black" opacity="0.15"/>
</svg>`;
}

// Create all icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
    const svgContent = createCroppedIconSVG(size);
    fs.writeFileSync(`public/icons/icon-${size}x${size}-cropped.svg`, svgContent);
});

console.log('Cropped VetsVan SVG icons created successfully!');