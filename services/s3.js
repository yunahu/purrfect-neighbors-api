import AWS from "aws-sdk";

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export const UploadImage = async (file) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer
    };

    try {
        const data = await s3.upload(params).promise();
        return data.Location;
    } catch (error) {
        throw new Error("Image upload failed.");
    }
  };