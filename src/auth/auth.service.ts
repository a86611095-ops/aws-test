import { InternalErrorException, PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { BadRequestException, Injectable } from "@nestjs/common";
import dotenv from "dotenv";
import {
  CognitoIdentityProviderClient,

  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ComprehendClient, DetectSentimentCommand } from '@aws-sdk/client-comprehend';

import { CopyObjectCommand, DeleteObjectCommand, GetObjectAclCommand, GetObjectCommand, PutObjectAclCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  RekognitionClient,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { Engine, OutputFormat, PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
dotenv.config();
console.log(process.env.AWS_ACCESS_KEY,"AWS_ACCESS_KEY")
console.log(process.env.AWS_SECRET,"AWS_SECRET")


const sns = new SNSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  }
});
const sqs=new SQSClient({   region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  }
})
const s3 = new S3Client({
  region: "us-east-1" // change to your bucket region
});
  const queue="https://sqs.us-east-1.amazonaws.com/389548782125/user-signup-queue"

const topic="arn:aws:sns:us-east-1:389548782125:user-event-topic"
@Injectable()

export class AuthService {
    private readonly rekognition: RekognitionClient;
  private readonly bucket = 'arya-app-45678';
  private readonly region = 'us-east-1';
    private readonly polly = new PollyClient({ region: 'us-east-1' });

  private client = new CognitoIdentityProviderClient({
    region: "us-east-1",
  });
   constructor() {
    this.rekognition = new RekognitionClient({ region: this.region });
  }
 async getImageUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: 'arya-app-45678',
      Key: key,
    });

    const url = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 3600, // 1 hour
      },
    );

    return { url };
  }
 async uploadFile(file: any, folder = 'dev') {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    try {
      await s3.send(
        new PutObjectCommand({
        Bucket: "arya-app-45678",
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        }),
      );

      console.log(`Upload successful: ${key}`);
      return {
        success: true,
        key,
        url: `https://arya-app-45678.s3.$us-east-1.amazonaws.com/${key}`,
      };
    } catch (err) {
      console.error('S3 upload failed:', err);
      throw err;
    }
  }
  async bioToSpeech(userId: string, bioText: string) {
    // 1. Send text to Polly
    const result = await this.polly.send(
      new SynthesizeSpeechCommand({
        Text: bioText,
        OutputFormat: OutputFormat.MP3,
        VoiceId: 'Joanna',       // natural English female voice
        Engine: Engine.NEURAL,   // higher quality (1M free/mo)
      }),
    );

    // 2. Convert stream to buffer
    const stream = result.AudioStream as any;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    const audioBuffer = Buffer.concat(chunks);

    // 3. Save MP3 to S3
    const key = `audio/bio-${userId}.mp3`;
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
      }),
    );

    return {
      key,
      url: `https://${this.bucket}.s3.us-east-1.amazonaws.com/${key}`,
    };
  }
   async uploadAvatar(file: any) {

    // 1. Upload to temp first
    const { key: tempKey } = await this.uploadFile(file, 'temp');

    try {
      // 2. Run both checks in parallel
      await Promise.all([
        this.checkFace(tempKey),
        this.checkModeration(tempKey),
      ]);

      // 3. Passed — move to permanent avatars folder
      const finalKey = tempKey.replace('temp', 'dev');
      await this.copyObject(tempKey, finalKey);
      await this.deleteFile(tempKey);

      return {
        success: true,
        key: finalKey,
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${finalKey}`,
      };
    } catch (err) {
      // 4. Failed — delete temp file, surface error
      await this.deleteFile(tempKey);
      throw err;
    }
  }

  async login(email: string, password: string) {
    console.log("login here")
     const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: "2tmm1c0d1aip5c0tiviq1ldv5",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    console.log("1. login start")

  const response = await this.client.send(command)
  console.log("2. cognito done")

  await this.publishUserSignup(email)
  console.log("3. sns done")
    return {
      accessToken: response.AuthenticationResult?.AccessToken,
      idToken: response.AuthenticationResult?.IdToken,
      refreshToken: response.AuthenticationResult?.RefreshToken,
    };
 }
   async readQueue(email: string, password: string) {
   return 'hi'
  }
  async  publishUserSignup(email:string){
    const message={
      eventType:"USER_SIGNEDUP",
      email,
      createdAt:new Date().toISOString()

  }
   await sns.send(
    new PublishCommand({TopicArn:topic,Message:JSON.stringify(message)})
   )
   console.log("event published to sns")
}
async pollMessage(){
  const response=await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl:queue,
      MaxNumberOfMessages:1,
      WaitTimeSeconds:20
    })
  )
  const message=response.Messages||[]
  for (const msg of message){
    try {
      console.log("actual msg ",msg.Body)
      console.log("body",msg.Body)
      const body=JSON.parse(msg.Body!)
      const messages=JSON.parse(body.Message)
      console.log("actual msg",message)
      console.log("sending email to",messages.email)
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl:queue,
          ReceiptHandle:msg.ReceiptHandle
        })
      )
    } catch (err) {
      console.log(err)
    }
  }
}
async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    await s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      }),
    );
  }
async  analyseBio(text: string) {
  const client = new ComprehendClient({ region: 'us-east-1' });
  const result = await client.send(
    new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en',
    }),
  );
  return result.Sentiment; // 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'
}
  // ─── S3: delete ────────────────────────────────────────────────────
  async deleteFile(key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  // ─── Rekognition: face check ───────────────────────────────────────
  private async checkFace(s3Key: string): Promise<void> {
    const result = await this.rekognition.send(
      new DetectFacesCommand({
        Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
        Attributes: ['DEFAULT'],
      }),
    );

    const faces = result.FaceDetails ?? [];

    if (faces.length === 0) {
      throw new BadRequestException(
        'No face detected. Please upload a clear photo of your face.',
      );
    }
    if (faces.length > 1) {
      throw new BadRequestException(
        'Multiple faces detected. Avatar must show only one person.',
      );
    }
    if ((faces[0].Confidence ?? 0) < 90) {
      throw new BadRequestException(
        'Face not clear enough. Please use a better quality photo.',
      );
    }
  }

  // ─── Rekognition: NSFW check ───────────────────────────────────────
  private async checkModeration(s3Key: string): Promise<void> {
    const result = await this.rekognition.send(
      new DetectModerationLabelsCommand({
        Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
        MinConfidence: 70,
      }),
    );

    const flagged = result.ModerationLabels ?? [];

    if (flagged.length > 0) {
      const reasons = flagged.map((l) => l.Name).join(', ');
      throw new BadRequestException(`Image rejected: ${reasons}`);
    }
  }

}