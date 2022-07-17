const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const hpp = require('hpp');
const helmet = require('helmet');


const userRouter = require('./routes/user');
const postRouter = require('./routes/post');
const postsRouter = require('./routes/posts');
const hashtagRouter = require('./routes/hashtag');
const db = require('./models');
const passportConfig = require('./passport');

dotenv.config();
const app = express();

db.sequelize.sync()
    .then(() => {
        console.log('db 연결 성공');
    })
    .catch(console.error);

passportConfig();
app.set('trust proxy', 1);  //proxy server Nginx  설정시 이값 세팅해줘야 브라우저-Application-cookie-secure값이 true로 설정이되어 쿠카가 공유된다
if(process.env.NODE_ENV === 'production'){      //배포용을 위해
    app.use(morgan('combined'));
    app.use(hpp());
    app.use(helmet());
    app.use(cors({
        origin: 'https://hijong.monster',      //* -> localhost 로 변경, credentials: true면 직접 주소 지정해야함
        credentials: true,                      //쿠키사용 설정 
    }));
}else{
    app.use(morgan('dev'));
    app.use(cors({
        origin: true,
        credentials: true,                      //쿠키사용 설정 
    }));
}





app.use('/', express.static(path.join(__dirname, 'uploads')));      //back 폴더에 업로드폴더를 합쳐준다. join을 쓰는 이유가 os가 다르면 구분자가 다르기 때문
app.use(express.json());                            //제이슨 형태를 해석하기 위해
app.use(express.urlencoded({ extended: true }));      //form 에서 넘어오는 urlencoded를 위해
app.use(cookieParser('nodebirdsecret'));
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
    proxy: true,            //proxy server Nginx  설정시 이값 세팅해줘야 브라우저-Application-cookie-secure값이 true로 설정이되어 쿠카가 공유된다
    cookie: {
        httpOnly: true,
        secure: true,          //https 설정시 true로 변경할 예정
        domain: process.env.NODE_ENV === 'production' && '.hijong.monster'
    },
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
    res.send('hello express');
});


app.use('/user', userRouter);
app.use('/hashtag', hashtagRouter);
app.use('/post', postRouter);
app.use('/posts', postsRouter);

// app.use((err, req, res, next) => {  //기본적으로 에러처리가 되어있으나, 직접 에러처리 미들웨어 구현할 경우 구현함.
//     //에러처리 페이지를 따로 구현한다던지. 커스텀하게

// })


app.listen(3065, () => {
    console.log('서버 실행 중');
});