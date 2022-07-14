import { HYDRATE } from "next-redux-wrapper";
import { combineReducers } from "redux";
import post from './post';
import user from './user';

//이전상태, 액션 => 다음상태
// const rootReducer = combineReducers({
//     index: (state = {}, action)=>{
//         switch (action.type) {
//             case HYDRATE:       //서버사이드 렌더링
//                 console.log("HYDRATE", action);
//                 return { ...state, ...action.payload };


//             default:
//                 return state;
//         }

//     },
//     user,
//     post,

// });

const rootReducer = (state, action) => {
    switch (action.type) {
        case HYDRATE:
            // console.log("HYDRATE", action);          //로그 엄청많음....
            return action.payload;

        default: {
            const combinedReducer = combineReducers({
                user,
                post,
            });
            return combinedReducer(state, action);
        }
    }
};



export default rootReducer;