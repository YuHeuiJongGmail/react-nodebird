import { all, fork } from 'redux-saga/effects';
import axios from 'axios';
import postSaga from './post';
import userSaga from './user';
import {backUrl} from '../config/config';


// axios.defaults.baseURL = 'http://localhost:3065'; 
axios.defaults.baseURL = backUrl;  //
axios.defaults.withCredentials = true;      //쿠키 사용
export default function* rootSaga() {
    yield all([
        fork(postSaga),
        fork(userSaga),
    ]);
}