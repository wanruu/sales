import { configureStore } from '@reduxjs/toolkit'

import draftSlice from './features/draftSlice'


export default configureStore({
    reducer: {
        draft: draftSlice
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
})