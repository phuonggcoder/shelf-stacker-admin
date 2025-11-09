/**
 * Add loading-state-helper.js to all HTML pages
 */

const fs = require('fs');
const path = require('path');

console.log('📄 Adding loading-state-helper.js to HTML pages...\n');

const viewsDir = path.join(__dirname, 'views');
const htmlFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'));

const scriptTag = '<script src="/assets/js/loading-state-helper.js"></script>';
let modified = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(viewsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already added
    if (content.includes('loading-state-helper.js')) {
        console.log(`⏭️  ${file} - Already has loading-state-helper.js`);
        return;
    }
    
    // Add before closing </head> or before first <script> tag
    if (content.includes('</head>')) {
        content = content.replace('</head>', `    ${scriptTag}\n</head>`);
    } else if (content.includes('<script')) {
        content = content.replace('<script', `${scriptTag}\n    <script`);
    } else {
        console.warn(`⚠️  ${file} - No suitable location found`);
        return;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} - Added loading-state-helper.js`);
    modified++;
});

console.log(`\n✅ Modified ${modified} HTML files`);

