# typescript-node-boilerplate

Boilerplate application for creating a REST-ful API using Typscript + Node

## Getting Started

```
cp ./.env.example .env
cd api
npm install
npm run start
```

---

## Docker (lambda entrypoint)

This project can be run as a Lambda function behind an Application Load Balancer to save money.

Example commands below taken from [Deploy Node.js Lambda functions with container images](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html):
```
# Build the Docker image 
docker build -t ik-dev-ai-lambda-test:test -f Dockerfile-lambda --build-arg VERSION=TEST .

# Start the Docker image with the docker run command.
docker run -p 9000:8080 ik-dev-ai-lambda-test:test

# Test your application locally using the RIE
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'

# Deploy
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 924586450630.dkr.ecr.us-east-1.amazonaws.com
aws ecr create-repository --repository-name ik-dev-ai-lambda-test --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
docker tag ik-dev-ai-lambda-test:test 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-ai-lambda-test:latest
docker push 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-ai-lambda-test
```

---

## Docker (webser)

This project uses [Docker](https://www.docker.com/) along with ECS Fargate for hosting.

```
docker build --tag typescript-node-boilerplate .

docker run --rm --env-file ./.env -p 8080:8080 typescript-node-boilerplate

docker tag typescript-node-boilerplate:latest typescript-node-boilerplate:1.0.0
```

---


