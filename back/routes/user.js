const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');

const { User, Post, Image, Comment } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.get('/', async (req, res, next) => { // GET /user
  try {
    if (req.user) {
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          exclude: ['password']
        },
        include: [{
          model: Post,
          attributes: ['id'],
        }, {
          model: User,
          as: 'Followings',
          attributes: ['id'],
        }, {
          model: User,
          as: 'Followers',
          attributes: ['id'],
        }]
      })
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
   next(error);
  }
});

router.get('/followers', isLoggedIn, async (req, res, next) => { // GET /user/followers
  try {
    const user = await User.findOne({ where: { id: req.user.id }});
    if (!user) {
      res.status(403).send('없는 사람을 찾으려고 하시네요?');
    }
    const followers = await user.getFollowers({
      limit: parseInt(req.query.limit, 10),
    });
    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/followings', isLoggedIn, async (req, res, next) => { // GET /user/followings
  try {
    const user = await User.findOne({ where: { id: req.user.id }});
    if (!user) {
      res.status(403).send('없는 사람을 찾으려고 하시네요?');
    }
    const followings = await user.getFollowings({
      limit: parseInt(req.query.limit, 10),
    });
    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => { // GET /user/1
  try {
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
      attributes: {
        exclude: ['password']
      },
      include: [{
        model: Post,
        attributes: ['id'],
      }, {
        model: User,
        as: 'Followings',
        attributes: ['id'],
      }, {
        model: User,
        as: 'Followers',
        attributes: ['id'],
      }]
    })
    if (fullUserWithoutPassword) {
      const data = fullUserWithoutPassword.toJSON();
      data.Posts = data.Posts.length; // 개인정보 침해 예방
      data.Followers = data.Followers.length;
      data.Followings = data.Followings.length;
      res.status(200).json(data);
    } else {
      res.status(404).json('존재하지 않는 사용자입니다.');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:userId/posts', async (req, res, next) => { // GET /user/1/posts
  try {
    const where = { UserId: req.params.userId };
    if (parseInt(req.query.lastId, 10)) { // 초기 로딩이 아닐 때
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10)}
    } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
      }, {
        model: Image,
      }, {
        model: Comment,
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
          order: [['createdAt', 'DESC']],
        }],
      }, {
        model: User, // 좋아요 누른 사람
        as: 'Likers',
        attributes: ['id'],
      }, {
        model: Post,
        as: 'Retweet',
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
        }, {
          model: Image,
        }]
      }],
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ['password']
        },
        include: [{
          model: Post,
          attributes: ['id'],
        }, {
          model: User,
          as: 'Followings',
          attributes: ['id'],
        }, {
          model: User,
          as: 'Followers',
          attributes: ['id'],
        }]
      })
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
});

router.post('/', isNotLoggedIn, async (req, res, next) => { // POST /user/
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      }
    });
    if (exUser) {
      return res.status(403).send('이미 사용 중인 아이디입니다.');
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
    });
    res.status(201).send('ok');
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

router.post('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('ok');
});

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    await User.update({
      nickname: req.body.nickname,
    }, {
      where: { id: req.user.id },
    });
    res.status(200).json({ nickname: req.body.nickname });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => { // PATCH /user/1/follow
  try {
    const user = await User.findOne({ where: { id: req.params.userId }});
    if (!user) {
      res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
    }
    await user.addFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => { // DELETE /user/1/follow
  try {
    const user = await User.findOne({ where: { id: req.params.userId }});
    if (!user) {
      res.status(403).send('없는 사람을 언팔로우하려고 하시네요?');
    }
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => { // DELETE /user/follower/2
  try {
    const user = await User.findOne({ where: { id: req.params.userId }});
    if (!user) {
      res.status(403).send('없는 사람을 차단하려고 하시네요?');
    }
    await user.removeFollowings(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;






// const express = require('express');
// const bcrypt = require('bcrypt');
// const passport = require('passport');
// const { Op } = require('sequelize');
// const { User, Post, Image, Comment } = require('../models');
// const { isLoggedIn, isNotLoggedIn } = require('./middlewares');  //커스텀 미들웨어

// const db = require('../models');
// const router = express.Router();

// router.get('/', async (req, res, next) => {     //GET /user
//     console.log(req.headers);
//     try {
//         if (req.user) {
//             const fullUserWithOutPassword = await User.findOne({
//                 where: { id: req.user.id },
//                 // attributes: ['id', 'nickname', 'email'],
//                 attributes: {
//                     exclude: ['password'],
//                 },
//                 include: [{
//                     model: Post,
//                     attributes: ['id'],
//                 }, {
//                     model: User,
//                     as: 'Followings',
//                     attributes: ['id'],
//                 }, {
//                     model: User,
//                     as: 'Followers',
//                     attributes: ['id'],
//                 }]
//             })


//             res.status(200).json(fullUserWithOutPassword);
//         } else {
//             res.status(200).json(null);
//         }

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }

// });





// router.post('/login', isNotLoggedIn, (req, res, next) => {     //POSR /user/login
//     passport.authenticate('local', (err, user, info) => {       //err:서버에러, user:성공객체, info:클라이언트에러
//         if (err) {    //1.서버에러
//             console.error(err);
//             return next(err);       //next(err) 는 app.js의 마지막 listen 과 사이에 존재함.
//         }
//         if (info) {       //3. 클라이언트 에러
//             return res.status(401).send(info.reason);   //401:비인증. http 상태코드
//         }
//         return req.login(user, async (loginErr) => {   //패스포트 로그인 => passport.serializeUser 실행
//             if (loginErr) {
//                 console.error(loginErr);
//                 return next(loginErr);
//             }
//             const fullUserWithOutPassword = await User.findOne({
//                 where: { id: user.id },
//                 // attributes: ['id', 'nickname', 'email'],
//                 attributes: {
//                     exclude: ['password'],
//                 },
//                 include: [{
//                     model: Post,
//                     attributes: ['id'],
//                 }, {
//                     model: User,
//                     as: 'Followings',
//                     attributes: ['id'],
//                 }, {
//                     model: User,
//                     as: 'Followers',
//                     attributes: ['id'],
//                 }]
//             })


//             return res.status(200).json(fullUserWithOutPassword);
//         })
//     })(req, res, next);        //"미들웨어 확장": express 기법중 하나
// });

// router.post('/', isNotLoggedIn, async (req, res, next) => {    //POST /user/ 회원가입
//     try {
//         const exUser = await User.findOne({
//             where: {
//                 email: req.body.email,
//             }
//         });
//         if (exUser) {
//             return res.status(403).send('이미 사용중인 아이디입니다');
//         }
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         await User.create({
//             email: req.body.email,
//             nickname: req.body.nickname,
//             password: hashedPassword,
//         });
//         // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3060');
//         // res.setHeader('Access-Control-Allow-Origin', '*');       //모든 프론트서버 허용,
//         res.status(200).send('ok');
//         // res.json();
//     } catch (error) {
//         console.error(error);
//         next(error);        //500 에러
//     }

// });

// router.post('/logout', isLoggedIn, (req, res) => {
//     console.log(req.user);
//     req.logout();
//     req.session.destroy();
//     res.send('ok');
// });

// router.patch('/nickname', isLoggedIn, async (req, res, next) => {         // PATCH /user/nickname
//     try {
//         await User.update({
//             nickname: req.body.nickname,
//         }, {
//             where: { id: req.user.id },
//         });
//         res.status(200).json({ nickname: req.body.nickname });

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });



// router.get('/followings', isLoggedIn, async (req, res, next) => {         // GET /user/followings 팔로윙리스트 취득
//     try {
//         const user = await User.findOne({ where: { id: req.user.id } });
//         if (!user) {
//             res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
//         }
//         const followings = await user.getFollowings({
//             limit: parseInt(req.query.limit, 10),

//         });
//         res.status(200).json(followings);

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });


// router.get('/followers', isLoggedIn, async (req, res, next) => {         // GET /user/followers 팔로우리스트 취득
//     try {
//         const user = await User.findOne({ where: { id: req.user.id } });
//         if (!user) {
//             res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
//         }
//         const followers = await user.getFollowers({
//             limit: parseInt(req.query.limit, 10),

//         });
//         res.status(200).json(followers);

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });
// router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {         // PATCH /user/1/follow 팔로우
//     try {
//         const user = await User.findOne({ where: { id: req.params.userId } });
//         if (!user) {
//             res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
//         }
//         await user.addFollowers(req.user.id);
//         res.status(200).json({ UserId: parseInt(req.params.userId) });

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });


// router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => {         // DELETE /user/1/follow 언팔로우
//     try {
//         const user = await User.findOne({ where: { id: req.params.userId } });
//         if (!user) {
//             res.status(403).send('없는 사람을 언팔로우하려고 하시네요?');
//         }

//         await user.removeFollowers(req.user.id);
//         res.status(200).json({ UserId: parseInt(req.params.userId) });

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

// router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => {         // DELETE /user/follow/2
//     try {
//         const user = await User.findOne({ where: { id: req.params.userId } });
//         if (!user) {
//             res.status(403).send('없는 사람을 차단하려고 하시네요?');
//         }

//         await user.removeFollowings(req.user.id);
//         res.status(200).json({ UserId: parseInt(req.params.userId, 10) });

//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });
// router.get('/:userId', async (req, res, next) => { // GET /user/1       //** 매우중요: 와일드카느 params가 있는 라우터는 맨아래로 두는게 좋다. "/user/followers 가 걸려서 실행이 안됨." */
//     try {
//         const fullUserWithoutPassword = await User.findOne({
//             where: { id: req.params.userId },
//             attributes: {
//                 exclude: ['password']
//             },
//             include: [{
//                 model: Post,
//                 attributes: ['id'],
//             }, {
//                 model: User,
//                 as: 'Followings',
//                 attributes: ['id'],
//             }, {
//                 model: User,
//                 as: 'Followers',
//                 attributes: ['id'],
//             }]
//         })
//         if (fullUserWithoutPassword) {
//             const data = fullUserWithoutPassword.toJSON();
//             data.Posts = data.Posts.length; // 개인정보 침해 예방
//             data.Followers = data.Followers.length;
//             data.Followings = data.Followings.length;
//             res.status(200).json(data);
//         } else {
//             res.status(404).json('존재하지 않는 사용자입니다.');
//         }
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

// router.get('/:userId/posts', async (req, res, next) => { // GET /user/1/posts
//     try {
//         const where = { UserId: req.params.userId };
//         if (parseInt(req.query.lastId, 10)) { // 초기 로딩이 아닐 때
//             where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }
//         } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
//         const posts = await Post.findAll({
//             where,
//             limit: 10,
//             order: [['createdAt', 'DESC']],
//             include: [{
//                 model: User,
//                 attributes: ['id', 'nickname'],
//             }, {
//                 model: Image,
//             }, {
//                 model: Comment,
//                 include: [{
//                     model: User,
//                     attributes: ['id', 'nickname'],
//                     order: [['createdAt', 'DESC']],
//                 }],
//             }, {
//                 model: User, // 좋아요 누른 사람
//                 as: 'Likers',
//                 attributes: ['id'],
//             }, {
//                 model: Post,
//                 as: 'Retweet',
//                 include: [{
//                     model: User,
//                     attributes: ['id', 'nickname'],
//                 }, {
//                     model: Image,
//                 }]
//             }],
//         });
//         res.status(200).json(posts);
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

// module.exports = router;


