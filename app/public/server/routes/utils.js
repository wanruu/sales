const formatInsert = (oper, tableName, dictArray, fieldnames) => {
    if (dictArray.length === 0) {
        return { query: '', flatData: [] }
    }

    // fieldname
    // var fieldnames = fieldnames
    if (fieldnames.length === 0) {
        fieldnames = Object.keys(dictArray[0])
    }
    if (fieldnames.length === 0) {
        return { query: '', flatData: [] }
    }

    // main
    const itemHolder = fieldnames.map(() => '?').join(', ')
    const placeholders = dictArray.map(() => `(${itemHolder})`).join(', ')
    const query = `${oper} INTO ${tableName} (${fieldnames.join(', ')}) VALUES ${placeholders};`
    const flatData = [];
    dictArray.forEach(dict => {
        fieldnames.forEach(key => {
            flatData.push(dict[key])
        })
    })
    return { query: query, flatData: flatData }
}

exports.formatInsert = formatInsert