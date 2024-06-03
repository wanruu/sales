import { createSlice } from '@reduxjs/toolkit'


const initPage = () => {
    return {
        showSearchBox: false,
        searchMode: 'simple',
        keywords: '',
        searchForm: {},
        scrollY: 0
    }
}
const pageSlice = createSlice({
    name: 'page',
    initialState: { 
        salesOrder: initPage(),
        purchaseOrder: initPage(),
        salesRefund: initPage(),
        purchaseRefund: initPage(),
        product: initPage(),
        partner: initPage(),
        settings: { scrollY: 0 }
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
        setSearchMode(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                searchMode: action.searchMode
            }
            return {
                ...state, 
                ...updateDict
            }
        },
        toggleShowSearchBox(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                showSearchBox: !state[action.menuKey].showSearchBox
            }
            return {
                ...state, 
                ...updateDict
            }
        },
        updateScrollY(state, action) {
            const updateDict = {}
            updateDict[action.menuKey] = { 
                ...state[action.menuKey], 
                scrollY: action.scrollY
            }
            return {
                ...state, 
                ...updateDict
            }
        }
    }
})

export default pageSlice.reducer