import { applyMiddleware, compose, createStore } from 'redux';
import { createWrapper } from 'next-redux-wrapper';
import reducer from "../reducers";
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import rootSaga from '../sagas';

const loggerMiddleware = ({ dispatch, getState }) => (next) => (action) => {
    // console.log("loggerMiddleware",action);          //로그 많음.
    return next(action);
}

const configureStore = () => {
    const safaMiddleware = createSagaMiddleware();
    const middlewares = [safaMiddleware, loggerMiddleware];
    const enhancer = process.env.NODE_ENV === 'production'

        ? compose(applyMiddleware(...middlewares))
        : composeWithDevTools(applyMiddleware(...middlewares));
    // ? compose(applyMiddleware(safaMiddleware))
    // : composeWithDevTools(applyMiddleware(safaMiddleware, loggerMiddleware));

    const store = createStore(reducer, enhancer);
    store.sagaTask = safaMiddleware.run(rootSaga);
    return store;
}

const wrapper = createWrapper(configureStore, {
    debug: process.env.NODE_ENV == 'development'
});

export default wrapper;
