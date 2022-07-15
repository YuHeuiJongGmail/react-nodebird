// post/[id].js
import { useRouter } from 'next/router';
import axios from 'axios';
import { END } from 'redux-saga';
import wrapper from '../../store/configureStore';
import Head from 'next/head';


import { LOAD_POST_REQUEST } from '../../reducers/post';
import { LOAD_MY_INFO_REQUEST } from '../../reducers/user';
import AppLayout from '../../components/AppLayout';
import PostCard from '../../components/PostCard';
import { useSelector } from 'react-redux';

const Post = () => {
    const router = useRouter();
    const { id } = router.query;
    const { singlePost } = useSelector((state) => state.post);
    return (
        <AppLayout>
            <Head>
                <title>
                    {singlePost.User.nickname}
                    님의 글
                </title>
                <meta name="description" content={singlePost.content} />
                <meta property="og:title" content={`${singlePost.User.nickname}님의 게시글`} />
                <meta name="og:description" content={singlePost.content} />
                <meta property="og:image" content={singlePost.Images[0] ? singlePost.Images[0].src : 'https://hijong.monster/favicon.ico'} />
                <meta property="og:url" content={`https://hijong.monster/post/${id}`} />

            </Head>

            <PostCard post={singlePost} />

        </AppLayout>



    );

};


export const getServerSideProps = wrapper.getServerSideProps(async (context) => {
    const cookie = context.req ? context.req.headers.cookie : '';
    axios.defaults.headers.Cookie = '';         //**** ** 매우 중요
    if (context.req && cookie) {
        axios.defaults.headers.Cookie = cookie;
    }
    context.store.dispatch({
        type: LOAD_MY_INFO_REQUEST,
    });
    console.log("[id] page==", context.params.id);
    context.store.dispatch({
        type: LOAD_POST_REQUEST,
        data: context.params.id,        //const { id } = router.query;와 동일 == context.query.id 와 같음.
    });

    context.store.dispatch(END);                //LOAD_USER_REQUEST, LOAD_POSTS_REQUEST 가 SUCCESS될때까지 기다리게 하는 설정
    await context.store.sagaTask.toPromise();   //서버사이드렌더링,  store/configureStore store.sagaTask 와 매치s

});

export default Post;