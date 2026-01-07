const xlsx = require('xlsx');
const fs = require('fs');
const { getIpInfo } = require('./apiService');

// Helper to flatten object for Excel columns
function flattenObject(obj, prefix = '', res = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (typeof val === 'object' && val !== null) {
                flattenObject(val, newKey, res);
            } else {
                res[newKey] = val;
            }
        }
    }
    return res;
}

// Check first 10 rows to detect IP column
function detectIpColumn(ws) {
    const data = xlsx.utils.sheet_to_json(ws, { header: 1, limit: 10 });
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

    if (data.length === 0) return null;

    const numCols = data[0].length;
    const scores = new Array(numCols).fill(0);

    // Skip header, check rows 1-9
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        for (let j = 0; j < numCols; j++) {
            if (row[j] && ipRegex.test(String(row[j]).trim())) {
                scores[j]++;
            }
        }
    }

    // Find column with max matches
    let maxScore = 0;
    let bestCol = -1;
    for (let j = 0; j < numCols; j++) {
        if (scores[j] > maxScore) {
            maxScore = scores[j];
            bestCol = j;
        }
    }

    // Optional: threshold? if maxScore > 0 return bestCol
    return bestCol >= 0 ? bestCol : null;
}

async function processExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of arrays to easier handle columns)
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
        throw new Error('Excel文件为空或没有数据');
    }

    const ipColIndex = detectIpColumn(worksheet);
    if (ipColIndex === null) {
        throw new Error('在前10行中未自动检测到IP列');
    }

    console.log(`Detected IP in column index: ${ipColIndex}`);

    // Headers
    const headers = rows[0];
    // We will append headers later, let's process data rows

    // Process rows
    const processedRows = [headers]; // Start with original headers
    let newHeadersAdded = false;

    // Limit concurrency to avoid API rate limits? 
    // ipapi.is might have limits. Let's do batches.
    const batchSize = 1000;
    // For demo, standard loop is fine, but Promise.all with simple throttling is better

    // We process all rows
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const ip = row[ipColIndex];
        let enrichment = {};

        if (ip) {
            const ipStr = String(ip).trim();
            // Basic check before calling API
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipStr)) {
                const data = await getIpInfo(ipStr);
                enrichment = flattenObject(data);
            }
        }

        // Add enrichment keys to headers if not yet added
        if (!newHeadersAdded && Object.keys(enrichment).length > 0) {
            const enrichmentKeys = Object.keys(enrichment);
            processedRows[0] = [...headers, ...enrichmentKeys];
            newHeadersAdded = true;
        }

        // Make sure row aligns with new headers
        const newRow = [...row];
        // If headers expanded, we need to place values in correct slots
        // Actually simpler: just re-read the keys from the *extended* header 
        // But rows might have different returned data structure? 
        // Ideally we normalize headers based on the *first* successful hit or union of all.
        // For simplicity, we assume the structure is consistent or we take the first one found.
        // Better strategy: Collect all enriched data first, then compute union of headers, then build table.
        // But that requires holding everything in memory.
        // Let's stick to "Extend headers based on first valid response" for MVP.

        if (newHeadersAdded) {
            // Fill in the rest
            const currentHeaders = processedRows[0];
            for (let k = headers.length; k < currentHeaders.length; k++) {
                const key = currentHeaders[k];
                newRow[k] = enrichment[key] || '';
            }
        }
        processedRows.push(newRow);
    }

    // Create new workbook
    const newWs = xlsx.utils.aoa_to_sheet(processedRows);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, "Processed");

    const buffer = xlsx.write(newWb, { type: 'buffer', bookType: 'xlsx' });

    // Cleanup uploaded file
    fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete upload:', err);
    });

    return buffer;
}

module.exports = { processExcel };
