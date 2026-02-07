#!/usr/bin/env node
/**
 * 資料庫遷移腳本：新增送餐相關欄位
 * 執行方式：node migrate-add-delivery-fields.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變數未設定');
  process.exit(1);
}

async function migrate() {
  let connection;
  
  try {
    console.log('🔗 連接資料庫...');
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ 資料庫連接成功');

    // 檢查欄位是否已存在
    console.log('\n📋 檢查現有欄位...');
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'mealDeliveries'"
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('現有欄位:', existingColumns.join(', '));

    // 需要新增的欄位
    const fieldsToAdd = [
      {
        name: 'deliveredAt',
        sql: 'ALTER TABLE `mealDeliveries` ADD COLUMN `deliveredAt` TIMESTAMP NULL COMMENT "送達時間"',
      },
      {
        name: 'deliveredLatitude',
        sql: 'ALTER TABLE `mealDeliveries` ADD COLUMN `deliveredLatitude` VARCHAR(50) NULL COMMENT "送達時的緯度"',
      },
      {
        name: 'deliveredLongitude',
        sql: 'ALTER TABLE `mealDeliveries` ADD COLUMN `deliveredLongitude` VARCHAR(50) NULL COMMENT "送達時的經度"',
      },
      {
        name: 'deliveryPhotoUrl',
        sql: 'ALTER TABLE `mealDeliveries` ADD COLUMN `deliveryPhotoUrl` VARCHAR(500) NULL COMMENT "送達照片URL"',
      },
    ];

    console.log('\n🔧 開始新增欄位...');
    
    for (const field of fieldsToAdd) {
      if (existingColumns.includes(field.name)) {
        console.log(`⏭️  欄位 ${field.name} 已存在，跳過`);
      } else {
        console.log(`➕ 新增欄位 ${field.name}...`);
        await connection.query(field.sql);
        console.log(`✅ 欄位 ${field.name} 新增成功`);
      }
    }

    console.log('\n🎉 資料庫遷移完成！');
    
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 資料庫連接已關閉');
    }
  }
}

migrate();
