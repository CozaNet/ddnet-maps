#!/usr/bin/env bun

// 批量更新 DDNet types 的 flexvotes.cfg，添加 Gores 模式切换

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TYPES_DIR = join(import.meta.dir, '../types');

// 需要更新的 DDNet 类型（排除 novice 和 moderate 已手动更新，以及 gores.*）
const DDNET_TYPES = [
  'brutal',
  'insane',
  'dummy',
  'ddmax.easy',
  'ddmax.next',
  'ddmax.nut',
  'ddmax.pro',
  'oldschool',
  'solo',
  'race',
  'fun',
  'event'
];

// Gores 切换代码（要插入的内容）
const GORES_SWITCH_LINES = [
  'add_vote "☒ DDNᴇᴛ Mᴀᴘs" "info"',
  'add_vote "☐ Gᴏʀᴇs Mᴀᴘs" "clear_votes; exec types/gores.main/flexvotes.cfg; exec types/gores.main/votes.cfg"',
  'add_vote " " "info"'
];

function updateFlexVotesCfg(typeName: string) {
  const filePath = join(TYPES_DIR, typeName, 'flexvotes.cfg');

  try {
    // 读取文件内容
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 检查是否已经包含 Gores 切换（避免重复添加）
    if (content.includes('Gᴏʀᴇs Mᴀᴘs')) {
      console.log(`⏭️  跳过 ${typeName}：已包含 Gores 切换`);
      return;
    }

    // 找到 sv_server_type 行
    const serverTypeIndex = lines.findIndex(line => line.startsWith('sv_server_type'));

    if (serverTypeIndex === -1) {
      console.warn(`⚠️  ${typeName}：未找到 sv_server_type`);
      return;
    }

    // 在 sv_server_type 之后插入 Gores 切换代码
    lines.splice(serverTypeIndex + 1, 0, ...GORES_SWITCH_LINES);

    // 写回文件
    writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ 更新 ${typeName}`);
  } catch (error) {
    console.error(`❌ 更新 ${typeName} 失败:`, error);
  }
}

function main() {
  console.log('🚀 开始更新 DDNet types 的 flexvotes.cfg...\n');

  for (const typeName of DDNET_TYPES) {
    updateFlexVotesCfg(typeName);
  }

  console.log('\n✨ 更新完成！');
}

main();
