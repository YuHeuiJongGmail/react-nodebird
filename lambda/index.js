const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // react-nodebird-s3
  const Key = decodeURIComponent(event.Records[0].s3.object.key); // original/12312312_abc.png
  console.log(Bucket, Key);
  const filename = Key.split('/')[Key.split('/').length - 1];
  const ext = Key.split('.')[Key.split('.').length - 1].toLowerCase();
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
  console.log('filename', filename, 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise();
    console.log('original', s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body)
      .resize(400, 400, { fit: 'inside' })
      .toFormat(requiredFormat)
      .toBuffer();
    await s3.putObject({
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage,
    }).promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error)
    return callback(error);
  }
}



// //람다는 S3에 업로드 하지만 사용자 정보(S3용 액세스키)를 알아서 불러오기 때문에 사용자 정보를 세팅해줄 필요가 없다.
// //람다는 함수로 되어 있다.
// const AWS = require('aws-sdk');
// const sharp = require('sharp');

// const s3 = new AWS.S3();
// //이미지 업로드될때 호출이 되도록
// exports.hadler = async (event, context, callback) => {
//     const Bucket = event.Records[0].s3.bucket.name;     //react-nodebird-yhj
//     const Key = decodeURIComponent(event.Records[0].s3.object.key);         // original/123123_abc.png, 한글을 위해 decodeUrl
//     console.log(Bucket, Key);
//     const filename = Key.split('/')[Key.split('/').length - 1];     //123123_abc.png
//     const ext = Key.split('.')[Key.split('.').length - 1].toLowerCase();    //확장자를 소문자로 통일
//     const requiredFormat = ext == 'jpg' ? 'jpeg' : ext;
//     console.log('filename', filename, 'ext', ext);

//     try {
//         const s3Object = await s3.getObject({ Bucket, Key }).promise();
//         console.log('original', s3Object.Body.length);  //파일크기 byte
//         //이미지비율 유지하고 크기 지정
//         const resizedImage = await sharp(s3Object.Body).resize(400, 400, { fit: 'inside' })
//             .toFormat(requiredFormat)
//             .toBuffer();
//         await s3.putObject({        //다시 업로드하기
//             Bucket,
//             Key: `thumb/${filename}`,           //thumb 폴더에 업로드
//             Body: resizedImage,
//         }).promise();               //꼭 체크확인 나중에... 미리 작성해둠.
//         console.log('put', resizedImage.length);
//         return callback(null, `thumb/${filename}`);
//     } catch (error) {
//         console.error(error);
//         return callback(error);
//     }
// }





