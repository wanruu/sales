import * as XLSX from 'xlsx';


export const exportExcel = (filename, jsa) => {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(jsa);
    XLSX.utils.book_append_sheet(wb, ws);
    XLSX.writeFile(wb, filename);
}


export const exportExcelMultiSheet = (filename, jsas, names=[]) => {
    var wb = XLSX.utils.book_new();
    // jsas.forEach((idx, jsa) => {
    //     var ws = XLSX.utils.json_to_sheet(jsa);
    //     XLSX.utils.book_append_sheet(wb, ws);
    // });
    for (const [i, jsa] of jsas.entries()) {
        var ws = XLSX.utils.json_to_sheet(jsa);
        if (i < names.length) {
            XLSX.utils.book_append_sheet(wb, ws, names[i]);
        } else {
            XLSX.utils.book_append_sheet(wb, ws);
        }
    }
    XLSX.writeFile(wb, filename);
}