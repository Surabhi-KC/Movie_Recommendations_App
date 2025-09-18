# Movie Recommendations API

This project is a simple **Movie Recommendations API** built with **Node.js (Express)**, **AWS Lambda**, and **Docker**.  
It allows users to:
- Fetch movie recommendations (`GET /recommendations`)
- Add new recommendations (`POST /recommendations`)

Recommendations are stored in a local JSON file (`movies.json`), and new entries are scored via a Lambda function.
This project demonstrates how to build and deploy a hybrid cloud application using EC2, Docker, and AWS Lambda.

---

## Workflow

1. **Client (Postman / Frontend App)**  
   Sends requests to the API running on **EC2**.

2. **EC2 (Node.js API in Docker)**  
   - Handles `GET` and `POST` requests.  
   - Reads/writes `movies.json`.  
   - Invokes the **AWS Lambda function** when adding new recommendations.  

3. **Lambda Function**  
   - Accepts movie metadata.  
   - Computes a **match score** using IMDB, Rotten Tomatoes, and watch time.  
   - Returns the scored movie object to the EC2 API.  

---

## Project Setup

### Prerequisites
- AWS account   
- Node.js
- Postman

## Steps
### 1. Create IAM User
1. Log in to the **AWS Management Console**.
2. Navigate to **IAM** → **Users** → **Add users**.
3. Enter a username (e.g., `movies-app-user`).
4. Select **Programmatic access** (this generates `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`).
5. Click **Next → Attach existing policies directly**.
6. Attach the following policies:
   - **AWSLambda_FullAccess** → to invoke Lambda functions.  
   - **AmazonS3FullAccess** → if Lambda uses S3 for data.  
   - **AmazonEC2FullAccess** → to connect to EC2 instances.  
7. Click **Next** and complete user creation.
8. Download the `.csv` file containing your access keys.
9. Paste these keys (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) as strings in index.js.

## Note
- Store the `.csv` file securely (do **not** commit it to version control).

### 2. Creating and Deploying the Lambda Function
1. Go to **Lambda** → **Create function**.
2. Enter the following details:
   - **Name:** `movies_recommend` (use this name only as it is used to invoke the lambda function in index.js)
   - **Runtime:** Python 3.9.x or higher
3. Click **Create function**.
4. In the Lambda function dashboard, go to **Code** → **Upload from** → **.zip file**.
5. Upload a `.zip` containing **lambda_function.py**
6. Go to **Configuration** → **General configuration**.
7. Increase the **Timeout** to around **30 seconds** (useful if processing is heavy).
8. Go to the **Test** tab in the Lambda console.
9. Use the following sample payload:

```json
{
  "title": "Inception",
  "description": "A dream within a dream",
  "data": {
    "ratings": {
      "rottentomatoes": 87,
      "imdb": 8.8
    },
    "watch_time": 0.7
  }
}
```
10. The function should return:

```json
{
  "id": "123",
  "title": "Inception",
  "description": "A dream within a dream",
  "match_score": 0.92
}
```

### 3. Launching an EC2 Instance to Host the App
1. Go to **AWS Console** → **EC2** → **Instances** → **Launch instances**.
2. Enter the following details:
   - **Name:** `movies-app-server`
   - **AMI:** Ubuntu 22.04 LTS
   - **Instance type:** `t3.micro` (Free Tier eligible)
3. Under **Key pair (login)**, choose **Create new key pair**.
4. Download the `.pem` file (used for SSH access).
   - Store this file securely.
5. Allow the following inbound rules:
- **SSH (22):** from your IP (for secure access).
- **HTTP (80):** from anywhere (to allow web traffic).
- **Custom TCP (3000):** from anywhere (for testing the app).
- Anywhere means 0.0.0.0/0
6. Review your settings and click **Launch instance**.
7. Wait until the instance state shows **Running**.
8. Using Secure Copy Protocol(SCP), copy the files from the repo (except .md, .py and .txt files) into the EC2 instance
  ``` bash
  scp -i "/path/to/your-key.pem" -r ./project-folder ubuntu@<EC2-Public-IP>:/home/ubuntu/
  ```
  EC2-Public-IP can be obtained from the instance's details on AWS console
9. Connect to Instance
Use the `.pem` file to SSH into the instance:
```bash
ssh -i "/path/to/your-key.pem" ubuntu@<your-ec2-public-dns>
```
10. Install docker and docker-compose on the EC2 instance using the commands given in **installCommands.txt**
11. Exit the instance (using exit command) and reconnect using the ssh command.
12. Go to the project directory and build the app's docker image, using the commands given:
```bash
cd <project-folder-name>
docker-compose up --build -d
```
13. The app now runs on http://<EC2-Public-IP>:3000/recommendations

### 4. Testing via Postman
1. Click on Make API request
2. Choose GET as the method and enter **http://<EC2-Public-IP>:3000/recommendations** as the url.
   This returns a list of movie recommendations.
3. Now choose POST as the method (same URL), click on body and select raw.
   Enter a JSON object in the given format (an error is thrown otherwise)
   ```json
   {
      "title": "Avatar",
      "description": "Sci-fi adventure",
      "data": {
          "ratings": {
          "rottentomatoes": 82,
          "imdb": 7.9
        },
        "watch_time": 0.5
      }
    }
   ```
   This triggers the lambda function and returns a response with a match score.

   ---

## Future Improvements
  - Store/fetch movies.json in/from an S3 bucket instead of EC2 local storage for persistence.
  - Containerize Lambda & EC2 apps and push their images to ECR (Elastic Container Registry) for easier deployment.
  - Replace EC2 with API Gateway + Lambda + S3 for a fully serverless setup (no EC2 costs).
  - Add authentication & authorization for secure access.
  - Build a frontend UI to consume the API.

## Cost Notes
  - Lambda: Pay per request (first 1M free/month).
  - EC2: Pay per running hour (stop the instance to save running cost and terminate the instance to save instance storage costs).
  - S3 / ECR: Storage cost only if enabled.






