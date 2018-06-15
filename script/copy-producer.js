const FileSystem = require('fs');

FileSystem.renameSync('dist/Producers', 'dist/producers');

// FileSystem.readdirSync('producers')
//     .filter(v => v.endsWith('.map'))
//     .map(v => ({
//         name: `producers/${v}`,
//         content: JSON.parse(FileSystem.readFileSync(`producers/${v}`).toString())
//     }))
//     .forEach(file => {
//         file.content.sources = file.content.sources.map(v => v.replace('../../src/', '../src/'));
//         FileSystem.writeFileSync(file.name, JSON.stringify(file.content));
//     });

console.log('Copy producer finished');
