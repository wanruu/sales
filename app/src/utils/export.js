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


String.prototype.getLength = function() {
    var realLength = 0, len = this.length, charCode = -1
    for (var i = 0; i < len; i ++) {
        charCode = this.charCodeAt(i)
        realLength += charCode >= 0 && charCode <= 128 ? 1 : 2
    }
    return realLength
}


export class MyWorkBook {
    constructor (filename) {
        this.filename = filename
        this.book = XLSX.utils.book_new()
    }
    writeSheet (sheet) {
        XLSX.utils.book_append_sheet(this.book, sheet.sheet, sheet.name)
    }
    save () {
        XLSX.writeFile(this.book, `${this.filename}.xlsx`)
    }
}


export class MyWorkSheet {
    constructor (sheetName) {
        this.name = sheetName
        this.sheet = XLSX.utils.json_to_sheet([])
        this.nextRow = 1  // Start from 1
    }

    // ONLY SUPPORT 2 LEVELS
    writeHeaders (headers) {
        // headers format: [{title: '名称'}] or [{title: '名称', children: [{title: 'xx'}]}]
        // 1. Write Flat Headers
        var nHeaderRow = headers.find(header => header.children?.length > 0) == null ? 1 : 2
        var flatHeaders = headers.reduce((result, l1Header) => {
            if (l1Header.children?.length > 0) {
                const placeholder = [...Array(l1Header.children.length-1)].map(_ => '')
                const l2Headers = l1Header.children.map(h => h.title)
                return [[...result[0], l1Header.title,...placeholder], [...result[1], ...l2Headers]]
            }
            return [[...result[0], l1Header.title], [...result[1], '']]
        }, [[], []])
        flatHeaders = nHeaderRow === 1 ? [flatHeaders[0]] : flatHeaders  // pure string list
        XLSX.utils.sheet_add_aoa(this.sheet, flatHeaders, { origin: `A${this.nextRow}` })
        // 2. Merge Headers
        if (nHeaderRow === 2) {
            var curCol = 0
            const merges = headers.map(l1Header => {
                let merge
                if (l1Header.children?.length > 0) {
                    merge = { s: { r: this.nextRow-1, c: curCol}, e: { r: this.nextRow-1, c: curCol + l1Header.children.length - 1 } }
                    curCol += l1Header.children.length
                } else {
                    merge = { s: { r: this.nextRow-1, c: curCol}, e: { r: this.nextRow, c: curCol } }
                    curCol += 1
                }
                return merge
            })
            this.sheet['!merges'] = this.sheet['!merges'] ? [...this.sheet['!merges'], ...merges] : merges
        }
        this.nextRow += nHeaderRow
        // 3. Update Width
        this.autoUpdateColsWidth(flatHeaders)
    }

    writeRow (row) {
        if (row) {
            XLSX.utils.sheet_add_aoa(this.sheet, [row], { origin: `A${this.nextRow}` })
            this.nextRow += 1
        }
    }

    // ONLY SUPPORT 2 LEVELS
    writeJson (data, headers) {
        // headers format: [{title: '名称', dataIndex: 'name'}] or [{title: '名称', children: [{title, dataIndex}]}]
        // 1. Write Headers
        this.writeHeaders(headers)
        // 2. Write Data
        var nHeaderRow = headers.find(header => header.children?.length > 0) == null ? 1 : 2
        const headerDicts = nHeaderRow === 1 ? headers : headers.reduce((result, l1Header) => {
            if (l1Header.children?.length > 0) {
                return [...result, ...l1Header.children]
            }
            return [...result, l1Header]
        }, [])
        const flatData = data.map((record, idx) => {
            return headerDicts.map(header => {
                if (header.render) {
                    return header.render(record[header.dataIndex], record, idx)
                }
                return record[header.dataIndex]
            })
        })
        XLSX.utils.sheet_add_aoa(this.sheet, flatData, { origin: `A${this.nextRow}` })
        // 3. Merge Data
        const dataIndexes = headerDicts.map(d => d.dataIndex)
        data.forEach((record, idx) => {
            const spanedDataIndexes = Object.keys(record.rowSpan ?? {})
            spanedDataIndexes.forEach(dataIndex => {
                const rowSpan = record.rowSpan[dataIndex]
                if (rowSpan > 1) {
                    const col = dataIndexes.indexOf(dataIndex)
                    this.sheet['!merges'].push({ 
                        s: { r: this.nextRow+idx-1, c: col}, 
                        e: { r: this.nextRow+idx+rowSpan-2, c: col } 
                    })
                }
            })
        })
        this.nextRow += flatData.length
        // 4. Update Width
        this.autoUpdateColsWidth(flatData)
    }

    autoUpdateColsWidth (flatData) {
        if (flatData?.length > 0) {
            const oldNCol = this.sheet['!cols']?.length ?? 0
            const newNCol = flatData[0].length
            const initCols = [...Array(Math.max(oldNCol, newNCol))].map((_, idx) => idx < oldNCol ? this.sheet['!cols'][idx] : { })
            this.sheet['!cols'] = flatData.reduce((result, row) => {
                return result.map((col, idx) => {
                    col.wch = Math.max((col.wch || 0), (row[idx] || '').toString().getLength())
                    return col
                })
            }, initCols)
        }
    }

    // alignCenter () {
    //     for (const key in this.sheet) {
    //         if (key.at(0) !== '!') {
    //             this.sheet[key].s = { alignment: { vertical: 'center', horizontal: 'center' } }
    //         }
    //     }
    // }
}