const fs = require('fs');
const path = require('path');

const filesToFix = [
    'routes/analytics.js',
    'routes/behaviour.js',
    'routes/merits.js',
    'routes/attendance.js',
    'routes/classes.js',
    'routes/exports.js'
];

console.log('🔧 Patching teacher JOIN queries in route files...\n');

let totalPatches = 0;

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${file} (not found)`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let patchCount = 0;
    
    // Pattern 1: LEFT JOIN teachers t ON ... followed by t.name
    // Add LEFT JOIN public.users u ON t.user_id = u.id after teachers join
    // Replace t.name with u.name
    
    // Find all occurrences of "LEFT JOIN teachers t ON" and add users join after it
    const teacherJoinRegex = /(LEFT JOIN teachers t ON [^\n]+)/g;
    const matches = content.match(teacherJoinRegex);
    
    if (matches) {
        matches.forEach(match => {
            // Check if this join already has a users join after it
            const afterMatch = content.split(match)[1];
            if (afterMatch && !afterMatch.substring(0, 100).includes('LEFT JOIN public.users u ON t.user_id = u.id')) {
                // Add the users join
                content = content.replace(
                    match,
                    match + '\n            LEFT JOIN public.users u ON t.user_id = u.id'
                );
                patchCount++;
            }
        });
    }
    
    // Replace t.name with u.name (but only in SELECT and WHERE clauses, not in JOIN conditions)
    const tNameRegex = /([,\s])t\.name(\s+as\s+teacher_name)/gi;
    const tNameMatches = content.match(tNameRegex);
    if (tNameMatches) {
        content = content.replace(tNameRegex, '$1u.name$2');
        patchCount += tNameMatches.length;
    }
    
    // Also handle INNER JOIN teachers
    const innerJoinRegex = /(INNER JOIN teachers t ON [^\n]+)/g;
    const innerMatches = content.match(innerJoinRegex);
    
    if (innerMatches) {
        innerMatches.forEach(match => {
            const afterMatch = content.split(match)[1];
            if (afterMatch && !afterMatch.substring(0, 100).includes('LEFT JOIN public.users u ON t.user_id = u.id')) {
                content = content.replace(
                    match,
                    match + '\n            LEFT JOIN public.users u ON t.user_id = u.id'
                );
                patchCount++;
            }
        });
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file}: Applied ${patchCount} patches`);
        totalPatches += patchCount;
    } else {
        console.log(`⏭️  ${file}: No changes needed`);
    }
});

console.log(`\n🎉 Total patches applied: ${totalPatches}\n`);
process.exit(0);
