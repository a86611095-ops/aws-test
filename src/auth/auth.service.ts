import { InternalErrorException, PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { BadRequestException, Injectable } from "@nestjs/common";
import dotenv from "dotenv";
import {
  CognitoIdentityProviderClient,

  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
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
  const queue="https://sqs.us-east-1.amazonaws.com/389548782125/user-signup-queue"

const topic="arn:aws:sns:us-east-1:389548782125:user-event-topic"
@Injectable()

export class AuthService {
  private client = new CognitoIdentityProviderClient({
    region: "us-east-1",
  });

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

}