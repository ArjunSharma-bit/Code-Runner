// dump-code.js
const fs = require('fs');
const path = require('path');

// 1. Config: Folders to ignore and file types to include
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode'];
const INCLUDE_EXTS = ['.ts', '.tsx', '.js', '.json', '.css', '.dockerfile', 'Dockerfile'];

// 2. Output file name
const OUTPUT_FILE = 'project-dump.txt';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            // Filter by extension and ignore package-lock
            if (INCLUDE_EXTS.includes(path.extname(fullPath)) && file !== 'package-lock.json') {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

// 3. Main Execution
try {
    console.log(' Scanning project files...');
    const files = getAllFiles(__dirname);

    let content = `PROJECT DUMP GENERATED AT ${new Date().toISOString()}\n`;
    content += `=================================================\n\n`;

    files.forEach(file => {
        // Read file content
        const fileContent = fs.readFileSync(file, 'utf8');

        // Create a clear separator for the AI to read
        const relativePath = path.relative(__dirname, file);
        content += `\n\n--- START OF FILE: ${relativePath} ---\n`;
        content += fileContent;
        content += `\n--- END OF FILE: ${relativePath} ---\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(` Done! All code saved to: ${OUTPUT_FILE}`);
    console.log(` Total files scanned: ${files.length}`);
} catch (e) {
    console.error('Error:', e);
}