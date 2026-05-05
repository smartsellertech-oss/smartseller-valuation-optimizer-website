/**
 * ══════════════════════════════════════════════════════════════
 * SMARTSELLER — Google Apps Script (Google Sheets Web App)
 * ══════════════════════════════════════════════════════════════
 *
 * COMO INSTALAR (passo a passo):
 *
 * 1. Abra o Google Sheets onde quer salvar os leads
 * 2. Menu → Extensions (Extensões) → Apps Script
 * 3. Apague o conteúdo do editor e cole TODO este arquivo
 * 4. Salve (Ctrl+S) com o nome "SmartSeller Leads"
 * 5. Clique em "Deploy" (Implantar) → "New deployment"
 * 6. Tipo: "Web app"
 *    - Execute as: "Me" (seu email)
 *    - Who has access: "Anyone" (qualquer pessoa)
 * 7. Clique "Deploy" → Autorize o app → Copie a URL gerada
 * 8. Cole a URL no campo SHEETS_ENDPOINT do arquivo HTML
 *    (procure por: SHEETS_ENDPOINT: 'https://script.google.com...')
 *
 * ══════════════════════════════════════════════════════════════
 */

// Nome da planilha onde os dados serão gravados
var SHEET_NAME = 'Leads';

// Colunas da planilha (na ordem em que aparecem)
var COLUMNS = [
  'Timestamp',
  'Source',
  'Name',
  'Email',
  'Company',
  'Extra (LinkedIn)',
  'Business Type / Channel',
  'Revenue / ARR',
  'Exit Goal',
  'Biggest Gap / Challenge',
  'All Answers (JSON)'
];

/**
 * Recebe o POST do site e grava na planilha.
 * Retorna JSON para confirmar.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    writeToSheet(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Suporte a GET para teste rápido via browser
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SmartSeller Sheets endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Escreve uma linha na planilha.
 * Cria os cabeçalhos automaticamente na primeira vez.
 */
function writeToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // Cria a aba se não existir
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Cabeçalhos
    sheet.appendRow(COLUMNS);
    // Estilo dos cabeçalhos
    var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
    headerRange.setBackground('#111111');
    headerRange.setFontColor('#E2EBE5');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);
    // Larguras de coluna
    sheet.setColumnWidth(1, 160);  // Timestamp
    sheet.setColumnWidth(2, 120);  // Source
    sheet.setColumnWidth(3, 140);  // Name
    sheet.setColumnWidth(4, 200);  // Email
    sheet.setColumnWidth(5, 160);  // Company
    sheet.setColumnWidth(6, 200);  // LinkedIn
    sheet.setColumnWidth(7, 180);  // Business Type
    sheet.setColumnWidth(8, 130);  // Revenue
    sheet.setColumnWidth(9, 200);  // Goal
    sheet.setColumnWidth(10, 220); // Gap
    sheet.setColumnWidth(11, 300); // JSON
  }

  // Linha de dados
  var row = [
    data.timestamp || new Date().toISOString(),
    data.source || '',
    data.name || '',
    data.email || '',
    data.company || '',
    data.extra || '',
    data.businessType || '',
    data.revenue || '',
    data.goal || '',
    data.gap || '',
    JSON.stringify(data.answers || {})
  ];

  sheet.appendRow(row);

  // Formata a linha recém-adicionada com leve destaque
  var lastRow = sheet.getLastRow();
  var rowRange = sheet.getRange(lastRow, 1, 1, COLUMNS.length);
  if (lastRow % 2 === 0) {
    rowRange.setBackground('#f8f9fa');
  }
  rowRange.setVerticalAlignment('middle');
  sheet.setRowHeight(lastRow, 28);

  Logger.log('Lead gravado: ' + data.email + ' @ ' + data.timestamp);
}

/**
 * Função de teste — rode manualmente no editor para verificar se tudo funciona
 * antes de implantar o Web App.
 */
function testWrite() {
  writeToSheet({
    timestamp: new Date().toISOString(),
    source: 'Test (Manual)',
    name: 'Test User',
    email: 'test@example.com',
    company: 'Acme Corp',
    extra: 'https://linkedin.com/in/testuser',
    businessType: 'SaaS / Subscription business',
    revenue: '$2M – $5M',
    goal: 'Full acquisition — 6 to 12 months',
    gap: 'High churn or low NRR',
    answers: { type: 'SaaS', rev: '$2M – $5M', goal: 'Full acquisition', gap: 'High churn' }
  });
  Logger.log('Teste gravado com sucesso! Verifique a aba "' + SHEET_NAME + '".');
}
