import { createSlice } from '@reduxjs/toolkit'
import dayjs from 'dayjs'


const draftSlice = createSlice({
    name: 'draft',
    initialState: { value: [] },
    reducers: {
        add(state, action) {
            const drafts = state.value
            const draft = action.payload
            const matchedDraft = drafts.filter(d => d.draftTime.isSame(draft.draftTime))?.[0]
            if (matchedDraft) {
                // remove matched draft
                drafts.splice(drafts.indexOf(matchedDraft), 1)
            }
            // unshift (to first)
            drafts.unshift(Object.assign(draft, { draftTime: dayjs() }))
        },
        remove(state, action) {
            const drafts = state.value
            const draft = action.payload
            const matchedDraft = drafts.filter(d => d.draftTime.isSame(draft.draftTime))?.[0]
            if (matchedDraft) {
                drafts.splice(drafts.indexOf(matchedDraft), 1)
            }
        }
    }
})


export const { add, remove } = draftSlice.actions

export default draftSlice.reducer