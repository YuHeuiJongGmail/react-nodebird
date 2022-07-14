import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Head from 'next/head';
import { END } from 'redux-saga';

import { Avatar, Card } from 'antd';
import AppLayout from '../components/AppLayout';
import wrapper from '../store/configureStore';
import { LOAD_USER_REQUEST } from '../reducers/user';


const About = () => {
    const { userInfo } = useSelector((state) => state.user);

    return (
        <AppLayout>
            <Head>
                <title>ZeroCho | NodeBird</title>
            </Head>
            {userInfo
                ? (
                    <Card
                        actions={[
                            <div key="twit">
                                짹짹
                                <br />
                                {userInfo.Posts.length}
                            </div>,
                            <div key="following">
                                팔로잉
                                <br />
                                {userInfo.Followings.length}
                            </div>,
                            <div key="follower">
                                팔로워
                                <br />
                                {userInfo.Followers.length}
                            </div>,
                        ]}
                    >
                        <Card.Meta
                            avatar={<Avatar>{userInfo.nickname[0]}</Avatar>}
                            title={userInfo.nickname}
                            description="노드버드 매니아"
                        />
                    </Card>
                )
                : null}
        </AppLayout>
    );
};


export const getStaticProps = wrapper.getStaticProps( async (context) =>{           //프론트서버측에서 html로 미리 렌더링 할수 있을때 사용, >> 대부분 staticServer  사용함
    context.store.dispatch({
        type: LOAD_USER_REQUEST,
        data: 1,
    });
    context.store.dispatch(END);
    await context.store.sagaTask.toPromise();
})

export default About;
