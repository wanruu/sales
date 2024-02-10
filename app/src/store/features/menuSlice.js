import { createSlice } from '@reduxjs/toolkit'


const menuSlice = createSlice({
    name: 'menu',
    initialState: { value: 'salesOrder' },
    reducers: {
        set(state, action) {
            return { ...state, value: action.payload}
        }
    }
})


export const { set } = menuSlice.actions

export default menuSlice.reducer