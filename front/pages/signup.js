import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';

import axios from 'axios';
import {END} from 'redux-saga';
import wrapper from '../store/configureStore';

import { Checkbox, Form, Input, Button } from 'antd';
import styled from 'styled-components';
import AppLayout from '../components/AppLayout';
import useInput from '../hooks/useInput';
import { SIGN_UP_REQUEST } from '../reducers/user';
import { useDispatch, useSelector } from 'react-redux';
import Router from 'next/router';

const ErrorMessage = styled.div`
  color: red;
`;

const Signup = () => {
  const dispatch = useDispatch();
  const { signUpLoading, signUpDone, signUpError, me} = useSelector((state)=>state.user);

  useEffect(()=>{
    if(me && me.id){
      Router.replace('/');    //뒤로가기 페이지 없앰
    }
  }, [me && me.id]);

  useEffect(()=>{
    if(signUpDone){
      Router.replace('/');       //push는 뒤로가기 페이지 있음
    }
  },[signUpDone]);

  useEffect(()=>{
    if(signUpError){
      alert(signUpError);
    }
  },[signUpError]);
  
  const [email, onChangeEmail] = useInput('');
  const [nickname, onChangeNickname] = useInput('');
  const [password, onChangePassword] = useInput('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const onChangePasswordCheck = useCallback((e) => {
    setPasswordCheck(e.target.value);
    setPasswordError(e.target.value !== password);
  }, [password]);

  const [term, setTerm] = useState('');
  const [termError, setTermError] = useState(false);
  const onChangeTerm = useCallback((e) => {
    setTerm(e.target.checked);
    setTermError(false);
  }, []);


  const onSubmit = useCallback(() => {
    if (password !== passwordCheck) {
      return setPasswordError(true);
    }
    if (!term) {
      return setTermError(true);
    }
    // console.log(email, nickname, password);
    dispatch({
      type: SIGN_UP_REQUEST,
      data: {email, password, nickname},
    });
  }, [email, password, passwordCheck, term]);

  return (
    <AppLayout>
      <Head>
        <title>회원가입 | NodeBird</title></Head>
      <Form onFinish={onSubmit}>
        <div>
          <label htmlFor="user-email">이메일</label>
          <br />
          <Input name="user-email" type="email" value={email} onChange={onChangeEmail} required></Input>
        </div>
        <div>
          <label htmlFor="user-nick">닉네임</label>
          <br />
          <Input name="user-nick" value={nickname} onChange={onChangeNickname} required></Input>
        </div>
        <div>
          <label htmlFor="user-password">비밀번호</label>
          <br />
          <Input name="user-password" type="password" value={password} onChange={onChangePassword} required></Input>
        </div>

        <div>
          <label htmlFor="user-password-check">비밀번호체크</label>
          <br />
          <Input
            name="user-password-check"
            type="password"
            value={passwordCheck}
            required
            onChange={onChangePasswordCheck}
          />
          {passwordError && <ErrorMessage>비밀번호가 일치하지 않습니다.</ErrorMessage>}
        </div>
        <div>
          <Checkbox name="user-term" checked={term} onChange={onChangeTerm}>
            제로초 말을 잘 들을 것을 동의합니다.
          </Checkbox>
          {termError && <ErrorMessage>약관에 동의하셔야 합니다.</ErrorMessage>}

        </div>
        <div style={{ marginTop: 10 }}>
          <Button type="primary" htmlType="submit" loading={signUpLoading}>가입하기</Button>
        </div>

      </Form>
    </AppLayout>

  )
};

export const getServerSideProps = wrapper.getServerSideProps( async (context) => {
  // console.log('getServerSideProps start');
  // console.log(context.req.headers);
  const cookie = context.req ? context.req.headers.cookie : '';
  axios.defaults.headers.Cookie = '';         //**** ** 매우 중요
  if(context.req && cookie){
      axios.defaults.headers.Cookie = cookie;
  }

  context.store.dispatch({
      type: LOAD_MY_INFO_REQUEST,
  })

  
  context.store.dispatch(END);                //LOAD_USER_REQUEST, LOAD_POSTS_REQUEST 가 SUCCESS될때까지 기다리게 하는 설정
  // console.log('getServerSideProps end');
  await context.store.sagaTask.toPromise();   //서버사이드렌더링,  store/configureStore store.sagaTask 와 매치s

});

export default Signup;
