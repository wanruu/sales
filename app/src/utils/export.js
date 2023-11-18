import * as XLSX from 'xlsx'
import _ from 'lodash'
import Decimal from 'decimal.js'

/*
    columns: { export: boolean, title: string, dataIndex: string }
    export col.title -> col.value
*/
export const getExportData = (columns, data) => {
    const rows = data.map((o, idx) => {
        const pairs = columns.map(col => [col.title, col.onExport ? col.onExport(o[col.dataIndex], o, idx) : o[col.dataIndex]])
        return _.fromPairs(pairs)
    })
    const summary = _.fromPairs(columns.map(col => {
        var val = col.summary || ''
        if (col.summary === 'sum') {
            val = data.reduce((pre, cur) => pre.plus(cur[col.dataIndex]) , Decimal(0)).toNumber()
        }
        return [col.title, val]
    }))
    if (Object.values(summary).filter(val => val !== '').length === 0) {
        return rows
    }
    return [...rows, summary]
}


export const exportExcel = (filename, jsa) => {
    var wb = XLSX.utils.book_new()
    var ws = XLSX.utils.json_to_sheet(jsa)
    if (jsa.length > 0) {
        ws['!cols'] = Object.keys(jsa[0]).map(key => {
            const maxWidth = jsa.reduce((w, r) => Math.max(w, (r[key] || '').toString().length), 10)
            return { wch: maxWidth }
        })
    }
    XLSX.utils.book_append_sheet(wb, ws)
    XLSX.writeFile(wb, filename + '.xlsx')
}


export const exportExcelMultiSheet = (filename, jsas, sheetnames=[]) => {
    var wb = XLSX.utils.book_new()
    // jsas.forEach((idx, jsa) => {
    //     var ws = XLSX.utils.json_to_sheet(jsa)
    //     XLSX.utils.book_append_sheet(wb, ws)
    // })
    for (const [i, jsa] of jsas.entries()) {
        var ws = XLSX.utils.json_to_sheet(jsa)
        if (jsa.length > 0) {
            ws['!cols'] = Object.keys(jsa[0]).map(key => {
                const maxWidth = jsa.reduce((w, r) => Math.max(w, (r[key] || '').toString().length), 10)
                return { wch: maxWidth }
            })
        }
        if (i < sheetnames.length) {
            XLSX.utils.book_append_sheet(wb, ws, sheetnames[i])
        } else {
            XLSX.utils.book_append_sheet(wb, ws)
        }
    }
    XLSX.writeFile(wb, filename + '.xlsx')
}