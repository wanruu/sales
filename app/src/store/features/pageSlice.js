import { createSlice } from '@reduxjs/toolkit'


/*
    {
        searchMode: simple/complex
        keywords: string
        searchForm: {},
        searchMode: 'simple'
    }
*/
const pageSlice = createSlice({
    name: 'page',
    initialState: { 
        salesOrder: { keywords: '', searchForm: {}, searchMode: 'simple' },
        purchaseOrder: { keywords: '', searchForm: {}, searchMode: 'simple' },
        salesRefund: { keywords: '', searchForm: {}, searchMode: 'simple' },
        purchaseRefund: { keywords: '', searchForm: {}, searchMode: 'simple' },
        product: { keywords: '', searchForm: {}, searchMode: 'simple' }
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
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                searchForm: {
                    ...state[action.menuKey].searchForm,
                    ...action.payload
                }
            }
            return {
                ...state, 
                ...updateDict
            }
        },
        resetSearchForm(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                searchForm: {}
            }
            return {
                ...state, 
                ...updateDict
            }
        },
        toggleSearchMode(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                searchMode: state[action.menuKey]?.searchMode === 'complex' ? 'simple' : 'complex'
            }
            return {
                ...state, 
                ...updateDict
            }
        }
    }
})

export default pageSlice.reducer