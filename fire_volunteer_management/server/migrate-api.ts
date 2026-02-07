/**
 * 臨時資料庫遷移 API
 * 用於在生產環境中執行資料庫遷移
 * 使用後應該刪除此檔案
 */

import type { Express } from 'express';
import mysql from 'mysql2/promise';

export function setupMigrationAPI(app: Express) {
  // 臨時遷移 endpoint
  // 訪問 /api/run-migration?secret=MIGRATION_SECRET 來執行遷移
  app.get('/api/run-migration', async (req, res) => {
    try {
      // 簡單的安全檢查
      const secret = req.query.secret;
      const expectedSecret = process.env.MIGRATION_SECRET || 'temp-migration-2026';
      
      if (secret !== expectedSecret) {
        return res.status(403).json({ 
          error: '未授權訪問',
          message: '請提供正確的 secret 參數'
        });
      }

      const DATABASE_URL = process.env.DATABASE_URL;
      
      if (!DATABASE_URL) {
        return res.status(500).json({ 
          error: 'DATABASE_URL 環境變數未設定' 
        });
      }

      console.log('🔗 開始資料庫遷移...');
      const connection = await mysql.createConnection(DATABASE_URL);
      
      try {
        // 檢查現有欄位
        const [columns] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'mealDeliveries'"
        ) as any;
        
        const existingColumns = columns.map((col: any) => col.COLUMN_NAME);
        console.log('現有欄位:', existingColumns);

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

        const results = [];
        
        for (const field of fieldsToAdd) {
          if (existingColumns.includes(field.name)) {
            console.log(`⏭️  欄位 ${field.name} 已存在，跳過`);
            results.push({ field: field.name, status: 'already_exists' });
          } else {
            console.log(`➕ 新增欄位 ${field.name}...`);
            await connection.query(field.sql);
            console.log(`✅ 欄位 ${field.name} 新增成功`);
            results.push({ field: field.name, status: 'added' });
          }
        }

        await connection.end();

        return res.json({
          success: true,
          message: '資料庫遷移完成',
          results,
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        await connection.end();
        console.error('遷移失敗:', error);
        return res.status(500).json({
          error: '遷移失敗',
          message: error.message
        });
      }

    } catch (error: any) {
      console.error('遷移 API 錯誤:', error);
      return res.status(500).json({
        error: '伺服器錯誤',
        message: error.message
      });
    }
  });

  console.log('✅ 遷移 API 已啟用: GET /api/run-migration?secret=YOUR_SECRET');
}
