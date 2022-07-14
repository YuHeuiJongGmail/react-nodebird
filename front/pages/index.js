import React, { useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {END} from 'redux-saga';
import AppLayout from "../components/AppLayout";
import { useDispatch, useSelector } from 'react-redux';
import PostForm from '../components/PostForm';
import PostCard from '../components/PostCard';
import { LOAD_POSTS_REQUEST } from '../reducers/post';
import { LOAD_MY_INFO_REQUEST } from '../reducers/user';
import wrapper from '../store/configureStore';



const Home = () => {
    const dispatch = useDispatch();
    const { me } = useSelector((state) => state.user);
    const { mainPosts, hasMorePosts, loadPostsLoading, retweetError } = useSelector((state) => state.post);

    useEffect(() => {
        if (retweetError) {
            alert(retweetError);
        }
    }, [retweetError]);

    //클라이언트서버 렌더링 된다.
    // useEffect(() => {
    //     dispatch({
    //         type: LOAD_USER_REQUEST,
    //     })

    //     dispatch({
    //         type: LOAD_POSTS_REQUEST,
    //     });
    // }, []);

    useEffect(() => {
        function onScroll() {
            // console.log(window.scrollY, document.documentElement.clientHeight, document.documentElement.scrollHeight);
            if (window.scrollY + document.documentElement.clientHeight > document.documentElement.scrollHeight - 300) {
                if (hasMorePosts && !loadPostsLoading) {
                    const lastId = mainPosts[mainPosts.length - 1]?.id;
                    dispatch({
                        type: LOAD_POSTS_REQUEST,
                        lastId,
                    });
                }

            }
        }

        window.addEventListener('scroll', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
        }
    }, [hasMorePosts, loadPostsLoading, mainPosts]);



    return (
        <>
            <AppLayout>
                {me && <PostForm />}
                {mainPosts.map((post) => <PostCard key={post.id} post={post} />)}
            </AppLayout>
        </>
    )
};

// Home.getInitialProps;
//이부분이 홈보다 먼저 실행된다. getServerSideProps >> reducer index.js 의 HYDRATE
export const getServerSideProps = wrapper.getServerSideProps( async (context) => {
    const cookie = context.req ? context.req.headers.cookie : '';
    // axios.defaults.headers.Cookie = cookie;         //3060, 3065간 쿠키세팅을 해준다. (기존은 브라우저가 자동으로 쿠서세팅을 해줬지만 서버간은 직접 세팅해야함.)
    //위의 설정은 프론트서버측에 대한 설정이므로, 다른사용자가 나의 쿠키가 공유되어버리는 경우가 발생할 수 있다.(쿠키 공유 문제 ) 이를 막기 위해 아래의 코딩 필요.
    axios.defaults.headers.Cookie = '';         //**** ** 매우 중요
    if(context.req && cookie){
        axios.defaults.headers.Cookie = cookie;
    }

    context.store.dispatch({
        type: LOAD_MY_INFO_REQUEST,
    })

    context.store.dispatch({
        type: LOAD_POSTS_REQUEST,
    });
    context.store.dispatch(END);                //LOAD_USER_REQUEST, LOAD_POSTS_REQUEST 가 SUCCESS될때까지 기다리게 하는 설정
    await context.store.sagaTask.toPromise();   //서버사이드렌더링,  store/configureStore store.sagaTask 와 매치s

});

export default Home;
