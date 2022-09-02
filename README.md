# ChillTalk

ChillTalk is a Web App for you to chill with friends real-time over messages and video.

https://chilltalk.space

## Test Account


User1

- Account: test123@test.com
- Password: test1234

User2

- Account: test124@test.com
- Password: test1234

## Tech Stack

- **Back-End:** Node.js, Express, Socket.IO, Nginx

- **Front-End:** HTML, CSS, JavaScript, WebRTC

- **Database:** MySQL (AWS RDS), Redis (AWS ElastiCache)

- **Cloud Service (AWS):** AWS ELB, AWS EC2, AWS S3, AWS CloudFront, AWS Route 53

## Architecture

![image](./docs/structure.jpg)
### Artillery Test Result
- Single server: 120 arrival rate / 60 seconds
- Two servers: 180 arrival rate / 60 seconds
### WebRTC Test Result
- 8 participants at most

## Database Schema

![image](./docs/DB_schema.png)

## Features

### Room / Channel Design

https://user-images.githubusercontent.com/57524411/181711955-096b69a0-424f-454a-b20d-2a86cfb217bc.mp4

- Create / join rooms with customized titles and with different users.
- Allow users to choose between voice and text channels.
- Provide room members with online status and their personal info, mutual friends and rooms.
- Room hosts are able to update room picture and name.

### Text Channel

https://user-images.githubusercontent.com/57524411/181712388-45fb11f7-6077-4646-a430-ae5d50532d5d.mp4

- Chat with your friend or other members in real time.
- Like, pin, edit, reply and delete messages.
- Jump to last read message whenever the user enters a channel.
- Group messages in the same block within a limited time frame.
- Users can check all unread messages in mailbox and all pinned messages.
- Search for messages in a room through user, channel name and pin status.

### Voice Channel

https://user-images.githubusercontent.com/57524411/181713461-aaa3c4a1-6549-4a68-bd82-4d41be40166b.mp4

- Users are able to communicate in video stream.
- Choose the main stream source to display in the center of the screen from diffrent users.
- Turn on / off camera or microphone.

### Friend

https://user-images.githubusercontent.com/57524411/181713490-a97e798a-242d-4619-b346-5f595a13b95d.mp4

- Allow the user to friend another user.
- Accept / reject friend request.
