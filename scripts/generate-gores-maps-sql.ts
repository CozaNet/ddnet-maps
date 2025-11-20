#!/usr/bin/env bun

// 生成 Gores 地图数据库 SQL 导入脚本

import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const GORES_DIR = join(import.meta.dir, '../gores');
const OUTPUT_SQL = join(import.meta.dir, 'insert-gores-maps.sql');

// Gores 难度配置
const GORES_DIFFICULTIES = [
  { folder: 'Easy', serverType: 'Gores_Easy', defaultStars: 2, defaultPoints: 5 },
  { folder: 'Main', serverType: 'Gores_Main', defaultStars: 3, defaultPoints: 10 },
  { folder: 'Hard', serverType: 'Gores_Hard', defaultStars: 4, defaultPoints: 15 },
  { folder: 'Insane', serverType: 'Gores_Insane', defaultStars: 5, defaultPoints: 20 },
  { folder: 'Extreme', serverType: 'Gores_Extreme', defaultStars: 5, defaultPoints: 25 },
  { folder: 'Mod', serverType: 'Gores_Mod', defaultStars: 3, defaultPoints: 10 },
  { folder: 'Solo', serverType: 'Gores_Solo', defaultStars: 3, defaultPoints: 10 }
];

/**
 * 扫描文件夹获取所有 .map 文件
 */
function scanMapFiles(folderPath: string): string[] {
  if (!existsSync(folderPath)) {
    return [];
  }

  const files = readdirSync(folderPath);
  return files
    .filter(file => file.endsWith('.map'))
    .map(file => basename(file, '.map'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/**
 * SQL 转义字符串
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * 生成 SQL 插入语句
 */
function generateInsertSql(): string[] {
  const lines: string[] = [];

  lines.push('-- Gores 地图数据库导入脚本');
  lines.push('-- 生成时间: ' + new Date().toISOString());
  lines.push('');
  lines.push('-- 注意: 此脚本会插入数据到 gores_maps 表');
  lines.push('-- 请根据你的实际情况修改地图作者名称（默认为 Unknown）');
  lines.push('');

  let totalMaps = 0;

  for (const difficulty of GORES_DIFFICULTIES) {
    const goresSubDir = join(GORES_DIR, difficulty.folder);
    const mapFiles = scanMapFiles(goresSubDir);

    if (mapFiles.length === 0) continue;

    totalMaps += mapFiles.length;

    lines.push('');
    lines.push(`-- ${difficulty.folder} (${mapFiles.length} 个地图)`);
    lines.push('');

    // 批量插入（每 100 个地图一组）
    for (let i = 0; i < mapFiles.length; i += 100) {
      const batch = mapFiles.slice(i, i + 100);

      lines.push('INSERT INTO gores_maps (Map, Server, Mapper, Points, Stars) VALUES');

      const values = batch.map((mapName, idx) => {
        const isLast = idx === batch.length - 1;
        return `  ('${escapeSql(mapName)}', '${difficulty.serverType}', 'Unknown', ${difficulty.defaultPoints}, ${difficulty.defaultStars})${isLast ? ';' : ','}`;
      });

      lines.push(...values);
      lines.push('');
    }
  }

  lines.push('');
  lines.push(`-- 总计: ${totalMaps} 个地图`);

  return lines;
}

function main() {
  console.log('🚀 开始生成 Gores 地图数据库 SQL 脚本...\n');

  if (!existsSync(GORES_DIR)) {
    console.error(`❌ Gores 文件夹不存在: ${GORES_DIR}`);
    process.exit(1);
  }

  const sqlLines = generateInsertSql();
  const sqlContent = sqlLines.join('\n');

  writeFileSync(OUTPUT_SQL, sqlContent);

  console.log(`✅ SQL 脚本已生成: ${OUTPUT_SQL}`);
  console.log(`📊 统计信息:`);

  let total = 0;
  for (const difficulty of GORES_DIFFICULTIES) {
    const mapFiles = scanMapFiles(join(GORES_DIR, difficulty.folder));
    console.log(`   - ${difficulty.folder}: ${mapFiles.length} 个地图`);
    total += mapFiles.length;
  }
  console.log(`   - 总计: ${total} 个地图\n`);

  console.log('📝 使用方法:');
  console.log('   1. 检查并编辑 SQL 脚本，修改地图作者等信息');
  console.log('   2. 在数据库中执行此脚本:');
  console.log('      - MySQL: mysql -u username -p database_name < insert-gores-maps.sql');
  console.log('      - SQLite: sqlite3 database.db < insert-gores-maps.sql');
}

main();
