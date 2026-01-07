const xlsx = require('xlsx');
const fs = require('fs');
const { getIpInfo } = require('./apiService');
const Job = require('../models/Job');

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

    return bestCol >= 0 ? bestCol : null;
}

async function processExcelAsync(jobId, filePath) {
    try {
        await Job.findByIdAndUpdate(jobId, { status: 'processing', progress: 0 });

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
            throw new Error('Excel文件为空或没有数据');
        }

        const ipColIndex = detectIpColumn(worksheet);
        if (ipColIndex === null) {
            throw new Error('在前10行中未自动检测到IP列');
        }

        console.log(`Detected IP in column index: ${ipColIndex}`);

        const headers = rows[0];
        const processedRows = [headers];
        let newHeadersAdded = false;

        // Process rows
        // Limit concurrency if needed. For now sequential to be safe with progress updates.
        const totalRows = rows.length - 1;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const ip = row[ipColIndex];
            let enrichment = {};

            if (ip) {
                const ipStr = String(ip).trim();
                if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipStr)) {
                    const data = await getIpInfo(ipStr);
                    enrichment = flattenObject(data);
                }
            }

            // Update Headers if needed
            if (!newHeadersAdded && Object.keys(enrichment).length > 0) {
                const enrichmentKeys = Object.keys(enrichment);
                processedRows[0] = [...headers, ...enrichmentKeys];
                newHeadersAdded = true;
            }

            const newRow = [...row];
            if (newHeadersAdded) {
                const currentHeaders = processedRows[0];
                for (let k = headers.length; k < currentHeaders.length; k++) {
                    const key = currentHeaders[k];
                    newRow[k] = enrichment[key] || '';
                }
            }
            processedRows.push(newRow);

            // Update progress every 10 rows or 10% to save DB writes
            if (i % 10 === 0 || i === totalRows) {
                const progress = Math.round((i / totalRows) * 100);
                await Job.findByIdAndUpdate(jobId, { progress });
            }
        }

        // Save result
        const newWs = xlsx.utils.aoa_to_sheet(processedRows);
        const newWb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWb, newWs, "Processed");

        const resultFilename = `processed_${jobId}.xlsx`;
        const resultPath = `uploads/${resultFilename}`;
        xlsx.writeFile(newWb, resultPath);

        // Cleanup original upload
        fs.unlink(filePath, (err) => {
            if (err) console.error('Cleanup error:', err);
        });

        await Job.findByIdAndUpdate(jobId, {
            status: 'completed',
            progress: 100,
            resultPath: resultPath
        });

    } catch (error) {
        console.error('Job failed:', error);
        await Job.findByIdAndUpdate(jobId, {
            status: 'failed',
            error: error.message
        });
        // Cleanup on failure
        fs.unlink(filePath, () => { });
    }
}

module.exports = { processExcelAsync };
