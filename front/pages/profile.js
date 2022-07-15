import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Router from 'next/router';
import axios from 'axios';
import useSWR from 'swr';

import { END } from 'redux-saga';
import wrapper from '../store/configureStore';
import AppLayout from '../components/AppLayout';
import NicknameEditForm from '../components/NicknameEditForm';
import FollowList from '../components/FollowList';
import { useDispatch, useSelector } from 'react-redux';
import { LOAD_FOLLOWERS_REQUEST, LOAD_FOLLOWINGS_REQUEST, LOAD_MY_INFO_REQUEST } from '../reducers/user';

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((result) => result.data);

const profile = () => {
  const dispatch = useDispatch();
  const [followersLimit, setFollowersLimit] = useState(3);
  const [followingsLimit, setFollowingsLimit] = useState(3);
  const { me } = useSelector((state) => state.user);
  const { data: followersData, error: followersError } = useSWR(`${backUrl}/user/followers?limit=${followersLimit}`, fetcher);
  const { data: followingsData, error: followingsError } = useSWR(`${backUrl}/user/followings?limit=${followingsLimit}`, fetcher);


  useEffect(() => {
    dispatch({
      type: LOAD_FOLLOWERS_REQUEST,

    });
    dispatch({
      type: LOAD_FOLLOWINGS_REQUEST,

    });

  }, []);

  useEffect(() => {
    if (!(me && me.id)) {
      Router.push('/');
    }
  }, [me && me.id]);

  const loadMoreFollowings = useCallback(() => {
    setFollowingsLimit((prev) => prev + 3);
  })
  const loadMoreFollowers = useCallback(() => {
    setFollowersLimit((prev) => prev + 3);
  })


  if (!me) {
    return "내 정보 로딩중...";
  }

  if (followersError || followingsError) {       //리턴이 훅스보다 위에 놓일 수  없ㅏ.이유는 실행하는 훅스가 4개였다, 3개였다하면 에러남. 그러므로 리턴이 훅스보다 아래에 있어야 한다.
    console.error(followerError || followingsError);
    return <div>팔로잉/팔로워 로딩 중 에러가 발생합니다.</div>
  }


  return (
    <>
      <Head>
        <title>내 프로필 | NodeBird</title>
      </Head>
      <AppLayout>
        <NicknameEditForm />
        <FollowList header="팔로잉" data={followingsData} onClickMore={loadMoreFollowings} loading={!followingsData && !followingsError} />
        <FollowList header="팔로워" data={followersData} onClickMore={loadMoreFollowers} loading={!followersData && !followersError} />

      </AppLayout>
    </>
  )
}

export const getServerSideProps = wrapper.getServerSideProps(async (context) => {
  // console.log('getServerSideProps start');
  // console.log(context.req.headers);
  const cookie = context.req ? context.req.headers.cookie : '';
  axios.defaults.headers.Cookie = '';         //**** ** 매우 중요
  if (context.req && cookie) {
    axios.defaults.headers.Cookie = cookie;
  }

  context.store.dispatch({
    type: LOAD_MY_INFO_REQUEST,
  })


  context.store.dispatch(END);                //LOAD_USER_REQUEST, LOAD_POSTS_REQUEST 가 SUCCESS될때까지 기다리게 하는 설정
  // console.log('getServerSideProps end');
  await context.store.sagaTask.toPromise();   //서버사이드렌더링,  store/configureStore store.sagaTask 와 매치s

});

export default profile;
