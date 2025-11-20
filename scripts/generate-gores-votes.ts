#!/usr/bin/env bun

// Gores 投票配置文件生成脚本
// 功能：
// 1. 扫描 txddnet/gores/ 下的所有子文件夹
// 2. 读取每个子文件夹中的 .map 文件
// 3. 为每个 Gores 难度生成对应的投票配置文件
// 4. 自动创建 types/gores.*/ 文件夹结构

import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

// 配置
const GORES_DIR = join(import.meta.dir, '../gores');
const TYPES_DIR = join(import.meta.dir, '../types');

// Gores 难度配置
const GORES_DIFFICULTIES = [
  { folder: 'Easy', name: 'Eᴀsʏ', serverType: 'Gores_Easy', defaultStars: 2 },
  { folder: 'Main', name: 'Mᴀɪɴ', serverType: 'Gores_Main', defaultStars: 3 },
  { folder: 'Hard', name: 'Hᴀʀᴅ', serverType: 'Gores_Hard', defaultStars: 4 },
  { folder: 'Insane', name: 'Iɴsᴀɴᴇ', serverType: 'Gores_Insane', defaultStars: 5 },
  { folder: 'Extreme', name: 'Exᴛʀᴇᴍᴇ', serverType: 'Gores_Extreme', defaultStars: 5 },
  { folder: 'Mod', name: 'Mᴏᴅ', serverType: 'Gores_Mod', defaultStars: 3 },
  { folder: 'Solo', name: 'Sᴏʟᴏ', serverType: 'Gores_Solo', defaultStars: 3 }
];

// 星级显示符号
const STARS_SYMBOLS = [
  '✰✰✰✰✰', // 0 星
  '★✰✰✰✰', // 1 星
  '★★✰✰✰', // 2 星
  '★★★✰✰', // 3 星
  '★★★★✰', // 4 星
  '★★★★★'  // 5 星
];

/**
 * 获取星级符号
 */
function getStarsSymbol(stars: number): string {
  return STARS_SYMBOLS[Math.min(Math.max(0, stars), 5)];
}

/**
 * 扫描文件夹获取所有 .map 文件
 */
function scanMapFiles(folderPath: string): string[] {
  if (!existsSync(folderPath)) {
    console.warn(`⚠️  文件夹不存在: ${folderPath}`);
    return [];
  }

  const files = readdirSync(folderPath);
  const mapFiles = files
    .filter(file => file.endsWith('.map'))
    .map(file => basename(file, '.map'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  return mapFiles;
}

/**
 * 生成 flexvotes.cfg 内容
 */
function generateFlexVotesCfg(difficulty: typeof GORES_DIFFICULTIES[0]): string {
  const lines: string[] = [];

  // 设置服务器类型
  lines.push(`sv_server_type "${difficulty.serverType}"`);
  lines.push('');

  // DDNet/Gores 总开关
  lines.push('add_vote "☐ DDNᴇᴛ Mᴀᴘs" "clear_votes; exec types/novice/flexvotes.cfg; exec types/novice/votes.cfg"');
  lines.push('add_vote "☒ Gᴏʀᴇs Mᴀᴘs" "info"');
  lines.push('add_vote " " "info"');
  lines.push('');

  // Gores 难度切换
  for (const diff of GORES_DIFFICULTIES) {
    const isCurrent = diff.folder === difficulty.folder;
    const checkbox = isCurrent ? '☒' : '☐';
    const command = isCurrent
      ? '"info"'
      : `"clear_votes; exec types/gores.${diff.folder.toLowerCase()}/flexvotes.cfg; exec types/gores.${diff.folder.toLowerCase()}/votes.cfg"`;

    lines.push(`add_vote "${checkbox} Gᴏʀᴇs ${diff.name}" ${command}`);
  }

  lines.push('add_vote "  " "info"');
  lines.push('');

  // 随机地图投票
  lines.push('add_vote "Make sure no one is racing before voting!" "info"');
  lines.push(`add_vote "Random Gores ${difficulty.folder} Map (Reason=Stars)" "sv_reset_file types/gores.${difficulty.folder.toLowerCase()}/flexreset.cfg; random_map"`);
  lines.push(`add_vote "Random Gores ${difficulty.folder} Map Unfinished by Vote Caller (Reason=Stars)" "sv_reset_file types/gores.${difficulty.folder.toLowerCase()}/flexreset.cfg; random_unfinished_map"`);
  lines.push('add_vote "   " "info"');

  return lines.join('\n');
}

/**
 * 生成 votes.cfg 内容
 */
function generateVotesCfg(difficulty: typeof GORES_DIFFICULTIES[0], mapFiles: string[]): string {
  const lines: string[] = [];

  lines.push('add_vote " " "info"');
  lines.push(`add_vote "─── GORES ${difficulty.folder.toUpperCase()} MAPS ───" "info"`);

  // 为每个地图生成投票选项
  for (const mapName of mapFiles) {
    const stars = getStarsSymbol(difficulty.defaultStars);
    lines.push(`add_vote "${mapName} | ${stars}" "sv_reset_file types/gores.${difficulty.folder.toLowerCase()}/flexreset.cfg; change_map \\"${mapName}\\""`);
  }

  return lines.join('\n');
}

/**
 * 生成 flexreset.cfg 内容
 */
function generateFlexResetCfg(difficulty: typeof GORES_DIFFICULTIES[0]): string {
  const lines: string[] = [];

  lines.push('exec reset.cfg');

  // Solo 模式需要特殊设置
  if (difficulty.folder === 'Solo') {
    lines.push('sv_solo_server 1');
  } else {
    lines.push('sv_solo_server 0');
  }

  lines.push('sv_vote_kick 1');
  lines.push('sv_deepfly 0');
  lines.push('clear_votes');
  lines.push(`exec types/gores.${difficulty.folder.toLowerCase()}/flexvotes.cfg`);
  lines.push(`exec types/gores.${difficulty.folder.toLowerCase()}/votes.cfg`);

  return lines.join('\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始生成 Gores 投票配置文件...\n');

  // 检查 gores 文件夹是否存在
  if (!existsSync(GORES_DIR)) {
    console.error(`❌ Gores 文件夹不存在: ${GORES_DIR}`);
    process.exit(1);
  }

  let totalMaps = 0;

  // 为每个难度生成配置文件
  for (const difficulty of GORES_DIFFICULTIES) {
    const goresSubDir = join(GORES_DIR, difficulty.folder);
    const typesSubDir = join(TYPES_DIR, `gores.${difficulty.folder.toLowerCase()}`);

    console.log(`📂 处理难度: ${difficulty.folder}`);

    // 扫描地图文件
    const mapFiles = scanMapFiles(goresSubDir);
    console.log(`   找到 ${mapFiles.length} 个地图`);
    totalMaps += mapFiles.length;

    // 创建 types 子文件夹
    if (!existsSync(typesSubDir)) {
      mkdirSync(typesSubDir, { recursive: true });
      console.log(`   ✅ 创建文件夹: ${typesSubDir}`);
    }

    // 生成并写入 flexvotes.cfg
    const flexVotesContent = generateFlexVotesCfg(difficulty);
    writeFileSync(join(typesSubDir, 'flexvotes.cfg'), flexVotesContent);
    console.log(`   ✅ 生成: flexvotes.cfg`);

    // 生成并写入 votes.cfg
    const votesContent = generateVotesCfg(difficulty, mapFiles);
    writeFileSync(join(typesSubDir, 'votes.cfg'), votesContent);
    console.log(`   ✅ 生成: votes.cfg`);

    // 生成并写入 flexreset.cfg
    const flexResetContent = generateFlexResetCfg(difficulty);
    writeFileSync(join(typesSubDir, 'flexreset.cfg'), flexResetContent);
    console.log(`   ✅ 生成: flexreset.cfg\n`);
  }

  console.log('✨ 配置文件生成完成！');
  console.log(`📊 统计信息:`);
  console.log(`   - 总难度数: ${GORES_DIFFICULTIES.length}`);
  console.log(`   - 总地图数: ${totalMaps}`);
  console.log(`   - 生成文件: ${GORES_DIFFICULTIES.length * 3} 个\n`);

  console.log('📝 下一步操作:');
  console.log('   1. 运行此脚本: bun run scripts/generate-gores-votes.ts');
  console.log('   2. 修改所有 DDNet types 的 flexvotes.cfg 文件');
  console.log('   3. 更新数据库中的 gores_maps 表');
  console.log('   4. 重启服务器并测试投票功能');
}

// 运行主函数
main();
