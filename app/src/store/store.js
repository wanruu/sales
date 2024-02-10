import { configureStore } from '@reduxjs/toolkit'

import draftSlice from './features/draftSlice'
import menuSlice from './features/menuSlice'
import pageSlice from './features/pageSlice'


export default configureStore({
    reducer: {
        draft: draftSlice,
        menu: menuSlice,
        page: pageSlice,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
})