import React, { useCallback } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { FOLLOW_REQUEST, UNFOLLOW_REQUEST } from '../reducers/user';

const FollowButton = ({ post }) => {
    const dispatch = useDispatch();
    const { me, followLoading, unFollowLoading } = useSelector((state) => state.user);
    
    // console.log("FollowButton me", me);
    const isFollowing = me?.Followings.find((v) => v.id === post.User.id);
    const onClickButton = useCallback(() => {
        if (isFollowing) {
            dispatch({
                type: UNFOLLOW_REQUEST,
                data: post.User.id,
            })
        }else {
            
            dispatch({
                type: FOLLOW_REQUEST,
                data: post.User.id,
            })
        }

    }, [isFollowing]);

    if(post.User.id === me.id){     //훅스 함수보다는 아래에 작성해야 한다
        return null;
    }

    return (
        <Button loading={followLoading || unFollowLoading} onClick={onClickButton}>
            {isFollowing ? '언팔로우' : '팔로우'}
        </Button>
    )
}

FollowButton.propTypes = {
    post: PropTypes.object.isRequired,
}

export default FollowButton
