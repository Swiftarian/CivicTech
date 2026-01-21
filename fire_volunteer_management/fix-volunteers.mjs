import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('開始清理志工使用者關聯...');
  
  // 1. 查詢EDDIE LIN的使用者ID
  const [eddieUsers] = await connection.query(
    'SELECT id FROM users WHERE name = ? LIMIT 1',
    ['EDDIE LIN']
  );
  
  if (eddieUsers.length === 0) {
    console.log('找不到EDDIE LIN使用者');
    process.exit(1);
  }
  
  const eddieUserId = eddieUsers[0].id;
  console.log(`EDDIE LIN使用者ID: ${eddieUserId}`);
  
  // 2. 查詢所有關聯到EDDIE LIN的志工
  const [volunteersWithEddie] = await connection.query(
    'SELECT id, employeeId, userId FROM volunteers WHERE userId = ?',
    [eddieUserId]
  );
  
  console.log(`找到 ${volunteersWithEddie.length} 個關聯到EDDIE LIN的志工`);
  
  // 3. 為每個志工建立獨立的使用者帳號
  for (const volunteer of volunteersWithEddie) {
    const openId = `volunteer-${volunteer.id}-${Date.now()}`;
    const name = volunteer.employeeId || `志工${volunteer.id}`;
    const email = `volunteer${volunteer.id}@taitung-disaster.local`;
    
    console.log(`為志工 ${name} 建立使用者帳號...`);
    
    // 建立新的使用者帳號
    const [result] = await connection.query(
      'INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)',
      [openId, name, email, 'manus', 'user']
    );
    
    const newUserId = result.insertId;
    
    // 更新志工記錄關聯到新的使用者
    await connection.query(
      'UPDATE volunteers SET userId = ? WHERE id = ?',
      [newUserId, volunteer.id]
    );
    
    console.log(`✓ 志工 ${name} 已關聯到新使用者 (ID: ${newUserId})`);
  }
  
  console.log('清理完成！');
} catch (error) {
  console.error('錯誤:', error);
} finally {
  await connection.end();
}
