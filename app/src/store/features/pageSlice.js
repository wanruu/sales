import { createSlice } from '@reduxjs/toolkit'


/*
    {
        searchMode: simple/complex
        
    }
*/
const pageSlice = createSlice({
    name: 'page',
    initialState: { 
        salesOrder: {},
        purchaseOrder: {},
        salesRefund: {},
        purchaseOrder: {}
    },
    reducers: {
        updateKeywords(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { ...state[action.menuKey], keywords: action.payload}
            return { 
                ...state, 
                ...updateDict
            }
        },
        updateSearchForm(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { ...state[action.menuKey], searchForm: action.payload}
            return {
                ...state, 
                ...updateDict
            }
        }
    }
})

export default pageSlice.reducer