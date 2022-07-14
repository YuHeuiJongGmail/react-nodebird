import { delay, put, takeLatest, all, fork, throttle, call } from "redux-saga/effects";
import shortid from "shortid";
import axios from 'axios';
import {
    ADD_COMMENT_REQUEST, ADD_COMMENT_SUCCESS, ADD_COMMENT_FAILURE,
    ADD_POST_REQUEST, ADD_POST_SUCCESS, ADD_POST_FAILURE,
    REMOVE_POST_REQUEST, REMOVE_POST_SUCCESS, REMOVE_POST_FAILURE,
    LOAD_POSTS_REQUEST, LOAD_POSTS_SUCCESS, LOAD_POSTS_FAILURE, generateDummyPost,
    LIKE_POST_REQUEST, LIKE_POST_SUCCESS, LIKE_POST_FAILURE,
    UNLIKE_POST_REQUEST, UNLIKE_POST_SUCCESS, UNLIKE_POST_FAILURE,
    UPLOAD_IMAGES_REQUEST, UPLOAD_IMAGES_SUCCESS, UPLOAD_IMAGES_FAILURE,
    RETWEET_REQUEST, RETWEET_SUCCESS, RETWEET_FAILURE,
    LOAD_POST_REQUEST, LOAD_POST_SUCCESS, LOAD_POST_FAILURE, 
    LOAD_USER_POSTS_REQUEST, LOAD_HASHTAG_POSTS_REQUEST, LOAD_HASHTAG_POSTS_SUCCESS, 
    LOAD_HASHTAG_POSTS_FAILURE, LOAD_USER_POSTS_SUCCESS, LOAD_USER_POSTS_FAILURE
} from '../reducers/post';
import { ADD_POST_TO_ME, REMOVE_POST_OF_ME } from "../reducers/user";

function retweetAPI(data) {
    return axios.post(`/post/${data}/retweet`);
}
function* retweet(action) {

    try {
        // console.log("saga login");
        const result = yield call(retweetAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: RETWEET_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        // console.log("err~~", err);
        // console.log("err.response~~", err.response);
        yield put({
            type: RETWEET_FAILURE,
            error: err.response.data,
        });
    }
}

function uploadImagesAPI(data) {
    return axios.post('/post/images', data);
}
function* uploadImages(action) {

    try {
        // console.log("saga login");
        const result = yield call(uploadImagesAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: UPLOAD_IMAGES_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: UPLOAD_IMAGES_FAILURE,
            error: err.response.data,
        });
    }
}


function likePostAPI(data) {
    return axios.patch(`/post/${data}/like`);
}
function* likePost(action) {

    try {
        // console.log("saga login");
        const result = yield call(likePostAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: LIKE_POST_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: LIKE_POST_FAILURE,
            error: err.response.data,
        });
    }
}

function unlikePostAPI(data) {
    return axios.delete(`/post/${data}/like`);
}
function* unlikePost(action) {

    try {
        console.log("saga unlikePost");
        const result = yield call(unlikePostAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        // console.log("unlikePost saga", result);
        yield put({
            type: UNLIKE_POST_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: UNLIKE_POST_FAILURE,
            error: err.response.data,
        });
    }
}

function loadHashtagPostsAPI(data, lastId) {
    return axios.get(`/hashtag/${encodeURIComponent(data)}?lastId=${lastId || 0}`);     //get에 한글들어가면 에러난다. 해시태그가 "노드"
}
function* loadHashtagPosts(action) {

    try {
        // console.log("saga login");
        const result = yield call(loadHashtagPostsAPI, action.data, action.lastId);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: LOAD_HASHTAG_POSTS_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: LOAD_HASHTAG_POSTS_FAILURE,
            error: err.response.data,
        });
    }
}

function loadUserPostsAPI(data, lastId) {
    return axios.get(`/user/${data}/posts?lastId=${lastId || 0}`);     //get 장점은 데이터캐싱이 된다.
}
function* loadUserPosts(action) {

    try {
        // console.log("saga login");
        const result = yield call(loadUserPostsAPI, action.data, action.lastId);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: LOAD_USER_POSTS_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: LOAD_USER_POSTS_FAILURE,
            error: err.response.data,
        });
    }
}



function loadPostsAPI(lastId) {
    return axios.get(`/posts?lastId=${lastId || 0}`);     //get 장점은 데이터캐싱이 된다.
}
function* loadPosts(action) {

    try {
        // console.log("saga login");
        const result = yield call(loadPostsAPI, action.lastId);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: LOAD_POSTS_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: LOAD_POSTS_FAILURE,
            error: err.response.data,
        });
    }
}


function loadPostAPI(data) {
    console.log("loadPostAPI====", `/post/${data}`);
    return axios.get(`/post/${data}`);     //get 장점은 데이터캐싱이 된다.
}
function* loadPost(action) {

    try {
        console.log("saga loadPost");
        const result = yield call(loadPostAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        yield put({
            type: LOAD_POST_SUCCESS,
            data: result.data,
        });

    } catch (err) {
        console.error(err);
        yield put({
            type: LOAD_POST_FAILURE,
            error: err.response.data,
        });
    }
}


function addPostAPI(data) {
    // console.log("saga addPost2");
    return axios.post('/post', data);
}
function* addPost(action) {

    try {
        // console.log("saga addPost1");
        const result = yield call(addPostAPI, action.data);
        // yield delay(1000);
        // const id = shortid.generate();
        // console.log("result.data", result.data);
        yield put({
            type: ADD_POST_SUCCESS,
            data: result.data,
        });
        yield put({
            type: ADD_POST_TO_ME,
            data: result.data.id,
        });


    } catch (err) {
        console.error(err);
        yield put({
            type: ADD_POST_FAILURE,
            error: err.response.data,
        });
    }
}


function removePostAPI(data) {
    return axios.delete(`/post/${data}`);
}
function* removePost(action) {

    try {
        // console.log("saga login");
        const result = yield call(removePostAPI, action.data);
        // yield delay(1000);
        yield put({
            type: REMOVE_POST_SUCCESS,
            data: result.data,
        });
        yield put({
            type: REMOVE_POST_OF_ME,
            data: action.data,
        });


    } catch (err) {
        console.error(err);
        yield put({
            type: REMOVE_POST_FAILURE,
            error: err.response.data,
        });
    }
}

function addCommentAPI(data) {
    return axios.post(`/post/${data.postId}/comment`, data);
}
function* addComment(action) {
    try {
        const result = yield call(addCommentAPI, action.data);
        // yield delay(1000);
        yield put({
            type: ADD_COMMENT_SUCCESS,
            data: result.data,
        });
    } catch (err) {
        console.error(err);
        yield put({
            type: ADD_COMMENT_FAILURE,
            error: err.response.data,
        });
    }
}

function* watchRetweet() {
    yield takeLatest(RETWEET_REQUEST, retweet);
}
function* watchUploadImages() {
    yield takeLatest(UPLOAD_IMAGES_REQUEST, uploadImages);
}

function* watchLikePost() {
    yield takeLatest(LIKE_POST_REQUEST, likePost);
}
function* watchUnlikePost() {
    yield takeLatest(UNLIKE_POST_REQUEST, unlikePost);
}

function* watchLoadHashtagPosts() {
    yield throttle(5000, LOAD_HASHTAG_POSTS_REQUEST, loadHashtagPosts);
}
function* watchLoadUserPosts() {
    yield throttle(5000, LOAD_USER_POSTS_REQUEST, loadUserPosts);
}

function* watchLoadPosts() {
    yield throttle(5000, LOAD_POSTS_REQUEST, loadPosts);
}
function* watchLoadPost() {
    yield takeLatest(LOAD_POST_REQUEST, loadPost);
}
function* watchAddPost() {
    yield takeLatest(ADD_POST_REQUEST, addPost);
}
function* watchRemovePost() {
    yield takeLatest(REMOVE_POST_REQUEST, removePost);
}
function* watchAddComment() {
    yield takeLatest(ADD_COMMENT_REQUEST, addComment);
}

export default function* postSaga() {
    yield all([
        fork(watchRetweet),
        fork(watchUploadImages),
        fork(watchLikePost),
        fork(watchUnlikePost),
        fork(watchAddPost),
        fork(watchLoadHashtagPosts),
        fork(watchLoadUserPosts),
        fork(watchLoadPosts),
        fork(watchLoadPost),
        fork(watchRemovePost),
        fork(watchAddComment),
    ]);
}

