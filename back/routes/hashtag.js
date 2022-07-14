const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Post, Hashtag, Image, Comment, User} = require('../models');

router.get('/:hashtag', async (req, res, next) => {     //GET /hashtag/노드
    try {
        const where = {};
        if (parseInt(req.query.lastId, 10)) {     //초기 로딩이 아닐때
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10) };
        }
        const posts = await Post.findAll({
            where,
            limit: 10,
            order: [
                ['createdAt', 'DESC'],          //게시글 날짜 내림차순으로 먼저 정렬
                // [Comment, 'createdAt', 'DESC']      //다음 댓글을 날짜 내림차순으로 정렬
            ],
            include: [{
                model: Hashtag,
                where: { name: decodeURIComponent(req.params.hashtag) },
            }, {
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }],
            }, {
                model: User,    //좋아요 누른사람
                as: 'Likers',
                attributes: ['id'],
            }],
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;