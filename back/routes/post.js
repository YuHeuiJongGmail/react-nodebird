const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Post, Comment, Image, User, Hashtag } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const router = express.Router();

try {
    fs.accessSync('uploads');
} catch (error) {
    console.log('upload 폴더가 없으므로 생성합니다.');
    fs.mkdirSync('uploads');
}
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) {       //제로초.png
            const ext = path.extname(file.originalname);    //확장자 추출(.png)
            const basename = path.basename(file.originalname, ext);      //제로초
            done(null, basename + '_' + new Date().getTime() + ext);      //제로초178198168189719.png
        },
        limits: { fileSize: 20 * 1024 * 1024 },      //20MB
    })

});

router.get('/:postId', async (req, res, next) => {    //GET /post/1  :1번 게시글 가져오기
    try {
        // console.log("req.params.postId===", req.params.postId);
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });
        if (!post) {
            return res.status(404).send('존재하지 않는 게시글입니다.');
        }
        
        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [{
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }]
            }, {  
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: User, // 좋아요 누른 사람
                as: 'Likers',
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }],
            }],
        })
        res.status(200).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {    //POST /post
    try {
        // console.log("/post~~");
        const hashtags = req.body.content.match(/#[^\s#]+/g);
        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id,        //로그인 했기 때문에 req.user에서 정보를 취득한다
        });
        if (hashtags) {
            const result = await Promise.all(hashtags.map((tag) => Hashtag.findOrCreate({
                where: { name: tag.slice(1).toLowerCase() },
            })));   //[[노드, true], [리액트, true]]
            await post.addHashtags(result.map((v) => v[0]));
        }


        if (req.body.image) {
            if (Array.isArray(req.body.image)) {      //이미지를 여러 개 올리면 image: [제로초.png, 부기초.png]
                const images = await Promise.all(req.body.image.map((image) => Image.create({ src: image })));       //Image 테이블에 이미지경로를 저장한다. 한꺼번에
                await post.addImages(images);           //생성한 새포스트에 이미지경로를 추가해준다.
            } else {                                  //이미지를 하나만 올리면 image: 제로초.png
                console.log("req.body.image", req.body.image);
                const image = await Image.create({ src: req.body.image });
                await post.addImages(image);
            }

        }

        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [{
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,        //댓글 작성자
                    attributes: ['id', 'nickname'],
                }],
            }, {
                model: User,        //게시글 작성자
                attributes: ['id', 'nickname'],
            }, {
                model: User,    //좋아요 누른사람
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
        res.status(200).json(fullPost);
    } catch (error) {
        console.error(error);
        next(error);
    }


});


router.post('/images', isLoggedIn, upload.array('image'), async (req, res, newt) => {  //POST /post/images
    console.log(req.files);
    res.json(req.files.map((v) => v.filename));         //생성된 파일이름을 클라이언트에 리턴해준다. 결국 src에 파일이름이 들어가고, 나중에 Image테이블 src컬럼에 파일이름이 들어감.


});




router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {    //POST /post/1/retweet  :리트윗
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
            include: [{
                model: Post,
                as: 'Retweet',
            }],
        })
        if (!post) {
            return res.status(403).send('존재하지 않는 게시글입니다.');
        }
        //자기게시글을 리트윗하거나  내게시글>리트윗>내가 다시 리트윗 금지
        if (req.user.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user.id)) {
            return res.status(403).send('자신의 글은 리트윗할 수 없습니다.');
        }
        const retweetTargetId = post.RetweetId || post.id;      //RetweetId가 null이면 포스트아이디 사용
        const exPost = await Post.findOne({
            where: {
                UserId: req.user.id,
                RetweetId: retweetTargetId,
            }
        })
        if (exPost) {
            return res.status(403).send('이미 리트윗했습니다');
        }
        const retweet = await Post.create({
            UserId: req.user.id,
            RetweetId: retweetTargetId,
            content: 'retweet',
        });
        const retweetWithPrevPost = await Post.findOne({
            where: { id: retweet.id },
            include: [{
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }]
            }, {
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: User, // 좋아요 누른 사람
                as: 'Likers',
                attributes: ['id'],
            }, {
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }],
            }],
        })
        res.status(201).json(retweetWithPrevPost);
    } catch (error) {
        console.error(error);
        next(error);
    }
});




router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {    //POST /post/1/comment
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
        })
        if (!post) {
            return res.status(403).send('존재하지 않는 게시글입니다.');
        }

        const comment = await Comment.create({
            content: req.body.content,
            PostId: parseInt(req.params.postId),     //파람에서 게시글아이디를 취득
            UserId: req.user.id,
        })
        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }],
        })
        res.status(201).json(fullComment);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {      //PATCH /post/1/like
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });

        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다.');
        }
        await post.addLikers(req.user.id);  //Likers
        // console.log("like", post);
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
        console.error(error);
        next(error);
    }



});
router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {     //DELETE /post/1/like
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다.');
        }
        await post.removeLikers(req.user.id);
        console.log("router delete-like", post);
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
        console.error(error);
        next(error);
    }
});



router.delete('/:postId', isLoggedIn, async (req, res) => {      //DELETE /post/1 게시글 삭제
    try {
        await Post.destroy({
            where: {
                id: req.params.postId,
                UserId: req.user.id,
            },

        });
        res.status(200).json({ PostId: parseInt(req.params.postId) });


    } catch (error) {
        console.error(error);
        next(error);
    }

});

module.exports = router;