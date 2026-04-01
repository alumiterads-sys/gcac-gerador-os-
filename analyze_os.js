import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeData() {
  try {
    const filePath = path.join(__dirname, 'serviços antigo sistema.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read headers and first 3 data rows
    const data = xlsx.utils.sheet_to_json(sheet, { header: 'A' });
    const rows = data.slice(0, 5); // 1 header + 4 data

    console.log("=== ANÁLISE DOS DADOS DA PLANILHA ===");
    rows.forEach((row, i) => {
      console.log(`Linha ${i}:`, JSON.stringify(row, null, 2));
    });

  } catch (err) {
    console.error("Erro ao analisar planilha:", err);
  }
}

analyzeData();
