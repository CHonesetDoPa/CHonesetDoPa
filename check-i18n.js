const fs = require('fs');
const path = require('path');

// 读取i18n文件
const zhData = JSON.parse(fs.readFileSync('./assets/i18n/zh.json', 'utf8'));
const enData = JSON.parse(fs.readFileSync('./assets/i18n/en.json', 'utf8'));

// 获取所有可用的键值
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const zhKeys = getAllKeys(zhData);
const enKeys = getAllKeys(enData);

console.log('I18n Keys Summary');
console.log('='.repeat(50));
console.log(`Chinese keys: ${zhKeys.length}`);
console.log(`English keys: ${enKeys.length}`);

// 找出HTML中使用的键值
const htmlFiles = ['index.html', 'sponsor.html'];
const usedKeys = new Set();

htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /data-i18n="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      usedKeys.add(match[1]);
    }
  }
});

console.log('\n Keys used in HTML files:');
console.log('-'.repeat(50));
Array.from(usedKeys).sort().forEach(key => console.log(`  ✓ ${key}`));

console.log('\n Missing keys:');
console.log('-'.repeat(50));
const missingKeys = [];
Array.from(usedKeys).forEach(key => {
  if (!zhKeys.includes(key)) {
    console.log(`  zh.json missing: ${key}`);
    missingKeys.push(key);
  }
  if (!enKeys.includes(key)) {
    console.log(`  en.json missing: ${key}`);
  }
});

if (missingKeys.length === 0) {
  console.log('  All keys are defined!');
}

console.log('\n Defined key sections overview:');
console.log('-'.repeat(50));
['site', 'about', 'skills', 'websites', 'sponsor'].forEach(section => {
  const sectionKeys = zhKeys.filter(key => key.startsWith(section + '.'));
  console.log(`  ${section}: ${sectionKeys.length} keys`);
  if (sectionKeys.length < 5) {
    sectionKeys.forEach(key => console.log(`    └─ ${key}`));
  }
});