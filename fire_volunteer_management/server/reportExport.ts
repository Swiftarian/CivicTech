import ExcelJS from 'exceljs';

// ============ 格式化函數 ============

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期時間為 YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ============ 翻譯函數 ============

/**
 * 翻譯任務狀態
 */
export function translateStatus(status: string | null | undefined): string {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'pending': '待指派',
    'assigned': '已指派',
    'in_transit': '送餐中',
    'delivered': '已送達',
    'undeliverable': '無法送達',
    'cancelled': '已取消',
  };
  
  return statusMap[status] || status;
}

/**
 * 翻譯收餐人狀況
 */
export function translateRecipientStatus(status: string | null | undefined): string {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'normal': '狀況正常',
    'needs_follow_up': '需後續關懷',
    'emergency': '緊急狀況',
  };
  
  return statusMap[status] || status;
}

/**
 * 翻譯送餐狀況
 */
export function translateMealStatus(status: string | null | undefined): string {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'delivered': '親手交遞',
    'left_at_door': '置於門口',
    'not_home': '無人在家',
    'refused': '拒收',
  };
  
  return statusMap[status] || status;
}

// ============ CSV 生成 ============

/**
 * 生成 CSV 格式的報表
 */
export function generateCSV(data: any[]): string {
  console.log('[generateCSV] 開始生成 CSV 報表');
  
  const headers = [
    '事故編號',
    '送餐日期',
    '送餐時段',
    '服務人員',
    '服務對象',
    '服務對象電話',
    '送餐地址',
    '餐點類型',
    '特殊說明',
    '任務狀態',
    '開始送餐時間',
    '送達時間',
    'GPS緯度',
    'GPS經度',
    '送達照片',
    '收餐人狀況',
    '送餐狀況',
    '志工備註',
    '任務備註',
  ];
  
  const rows = data.map(row => [
    row.deliveryNumber || '',
    formatDate(row.deliveryDate),
    row.deliveryTime || '',
    row.volunteerName || '',
    row.recipientName || '',
    row.recipientPhone || '',
    row.deliveryAddress || '',
    row.mealType || '',
    row.specialInstructions || '',
    translateStatus(row.status),
    formatDateTime(row.startTime),
    formatDateTime(row.deliveredAt),
    row.deliveredLatitude || '',
    row.deliveredLongitude || '',
    row.deliveryPhotoUrl || '',
    translateRecipientStatus(row.recipientStatus),
    translateMealStatus(row.mealStatus),
    row.serviceNotes || '',
    row.deliveryNotes || '',
  ]);
  
  // 將所有欄位用雙引號包裹，並處理內部的雙引號
  const escapeCsvField = (field: string) => {
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  };
  
  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(field => escapeCsvField(String(field))).join(','))
  ].join('\n');
  
  // 添加 UTF-8 BOM 以確保 Excel 正確顯示中文
  const bom = '\uFEFF';
  
  console.log(`[generateCSV] CSV 生成完成，共 ${data.length} 筆資料`);
  return bom + csvContent;
}

// ============ Excel 生成 ============

/**
 * 生成 Excel 格式的報表
 */
export async function generateExcel(data: any[]): Promise<Buffer> {
  console.log('[generateExcel] 開始生成 Excel 報表');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('送餐服務報表');
  
  // 設定欄位
  worksheet.columns = [
    { header: '事故編號', key: 'deliveryNumber', width: 20 },
    { header: '送餐日期', key: 'deliveryDate', width: 15 },
    { header: '送餐時段', key: 'deliveryTime', width: 12 },
    { header: '服務人員', key: 'volunteerName', width: 15 },
    { header: '服務對象', key: 'recipientName', width: 15 },
    { header: '服務對象電話', key: 'recipientPhone', width: 15 },
    { header: '送餐地址', key: 'deliveryAddress', width: 30 },
    { header: '餐點類型', key: 'mealType', width: 15 },
    { header: '特殊說明', key: 'specialInstructions', width: 20 },
    { header: '任務狀態', key: 'status', width: 12 },
    { header: '開始送餐時間', key: 'startTime', width: 20 },
    { header: '送達時間', key: 'deliveredAt', width: 20 },
    { header: 'GPS緯度', key: 'deliveredLatitude', width: 15 },
    { header: 'GPS經度', key: 'deliveredLongitude', width: 15 },
    { header: '送達照片', key: 'deliveryPhotoUrl', width: 40 },
    { header: '收餐人狀況', key: 'recipientStatus', width: 15 },
    { header: '送餐狀況', key: 'mealStatus', width: 12 },
    { header: '志工備註', key: 'serviceNotes', width: 25 },
    { header: '任務備註', key: 'deliveryNotes', width: 25 },
  ];
  
  // 設定標題列樣式
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // 添加資料
  data.forEach(row => {
    worksheet.addRow({
      deliveryNumber: row.deliveryNumber || '',
      deliveryDate: formatDate(row.deliveryDate),
      deliveryTime: row.deliveryTime || '',
      volunteerName: row.volunteerName || '',
      recipientName: row.recipientName || '',
      recipientPhone: row.recipientPhone || '',
      deliveryAddress: row.deliveryAddress || '',
      mealType: row.mealType || '',
      specialInstructions: row.specialInstructions || '',
      status: translateStatus(row.status),
      startTime: formatDateTime(row.startTime),
      deliveredAt: formatDateTime(row.deliveredAt),
      deliveredLatitude: row.deliveredLatitude || '',
      deliveredLongitude: row.deliveredLongitude || '',
      deliveryPhotoUrl: row.deliveryPhotoUrl || '',
      recipientStatus: translateRecipientStatus(row.recipientStatus),
      mealStatus: translateMealStatus(row.mealStatus),
      serviceNotes: row.serviceNotes || '',
      deliveryNotes: row.deliveryNotes || '',
    });
  });
  
  // 設定所有儲存格的對齊方式
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
  });
  
  console.log(`[generateExcel] Excel 生成完成，共 ${data.length} 筆資料`);
  
  // 生成 Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
