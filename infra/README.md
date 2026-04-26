# Career Jump – Infrastructure

CloudFormation templates for the Career Jump SaaS backend (auth, email, notifications).

---

## Stack overview

| File | Description |
|---|---|
| `frontend-site.yaml` | S3 bucket + CloudFront distribution for the React/Vite SPA |
| `cognito.yaml` | Cognito User Pool, App Client, and hosted-UI domain |
| `ses.yaml` | SES email identity, configuration set, six email templates, bounce/complaint SNS topic |
| `notification-lambda.yaml` | Python 3.12 Lambda that sends SES templated emails via SNS events |
| `full-stack.yaml` | Orchestrator – nested stacks for all of the above |

---

## Prerequisites

### 1. AWS CLI configured

```bash
aws configure
# or use AWS_PROFILE / environment credentials
```

### 2. SES domain or address verified

SES starts in sandbox mode. You must verify the sender email (or its domain) before deploying:

```bash
# Verify a single email address
aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1

# --- OR --- verify an entire domain (preferred for production)
aws ses verify-domain-identity --domain yourdomain.com --region us-east-1
# Then add the TXT DNS record returned in the output to your DNS provider.
```

For production, request SES production access via the AWS console (Support Center → SES Sending Limits increase).

### 3. Create an SNS topic for notifications (if not already managed elsewhere)

```bash
aws sns create-topic --name career-jump-poc-notifications --region us-east-1
# Note the returned TopicArn – pass it as NotificationTopicArn
```

### 4. Create a DynamoDB table (if not already managed elsewhere)

The table must use `PK` (String) as the partition key and `SK` (String) as the sort key:

```bash
aws dynamodb create-table \
  --table-name career-jump-poc-users \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 5. S3 bucket for nested-stack templates (full-stack.yaml only)

```bash
aws s3 mb s3://career-jump-cfn-templates --region us-east-1
```

---

## Deployment order

Deploy stacks independently **or** use `full-stack.yaml` for a single-command deploy.

### Option A – deploy stacks independently

```bash
REGION=us-east-1
APP=career-jump
STAGE=poc
FROM_EMAIL=noreply@yourdomain.com

# 1. Frontend (optional if already deployed)
aws cloudformation deploy \
  --template-file infra/frontend-site.yaml \
  --stack-name cj-web-frontend-${STAGE} \
  --parameter-overrides AppName=cj-web Stage=${STAGE} \
  --region ${REGION}

# 2. Cognito
aws cloudformation deploy \
  --template-file infra/cognito.yaml \
  --stack-name ${APP}-cognito-${STAGE} \
  --parameter-overrides \
      AppName=${APP} \
      Stage=${STAGE} \
      SESFromEmail=${FROM_EMAIL} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${REGION}

# 3. SES
aws cloudformation deploy \
  --template-file infra/ses.yaml \
  --stack-name ${APP}-ses-${STAGE} \
  --parameter-overrides \
      AppName=${APP} \
      Stage=${STAGE} \
      FromEmail=${FROM_EMAIL} \
  --region ${REGION}

# 4. Notification Lambda
#    Replace <UserPoolId> and <TopicArn> with actual values from previous outputs.
aws cloudformation deploy \
  --template-file infra/notification-lambda.yaml \
  --stack-name ${APP}-notification-${STAGE} \
  --parameter-overrides \
      AppName=${APP} \
      Stage=${STAGE} \
      UserPoolId=<UserPoolId> \
      SESFromEmail=${FROM_EMAIL} \
      DynamoDBTableName=${APP}-${STAGE}-users \
      NotificationTopicArn=<TopicArn> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${REGION}
```

### Option B – full-stack orchestrator (single deploy)

```bash
REGION=us-east-1
APP=career-jump
STAGE=poc
FROM_EMAIL=noreply@yourdomain.com
TEMPLATES_BUCKET=career-jump-cfn-templates
TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:career-jump-poc-notifications
DYNAMO_TABLE=career-jump-poc-users

# Package nested stack templates (uploads local files to S3 and rewrites TemplateURL)
aws cloudformation package \
  --template-file infra/full-stack.yaml \
  --s3-bucket ${TEMPLATES_BUCKET} \
  --s3-prefix infra \
  --output-template-file infra/full-stack-packaged.yaml \
  --region ${REGION}

# Deploy
aws cloudformation deploy \
  --template-file infra/full-stack-packaged.yaml \
  --stack-name ${APP}-full-stack-${STAGE} \
  --parameter-overrides \
      AppName=${APP} \
      FrontendAppName=cj-web \
      Stage=${STAGE} \
      SESFromEmail=${FROM_EMAIL} \
      DynamoDBTableName=${DYNAMO_TABLE} \
      NotificationTopicArn=${TOPIC_ARN} \
      TemplatesBucketName=${TEMPLATES_BUCKET} \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region ${REGION}
```

---

## Retrieving stack outputs

```bash
# All outputs for a given stack
aws cloudformation describe-stacks \
  --stack-name career-jump-cognito-poc \
  --query "Stacks[0].Outputs" \
  --output table \
  --region us-east-1
```

Use the `UserPoolId` and `UserPoolClientId` outputs to populate your `.env.local` / CI secrets.

---

## Parameter descriptions

| Parameter | Stack(s) | Description |
|---|---|---|
| `AppName` | all | Prefix for all resource names and CloudFormation exports. Default: `career-jump`. |
| `Stage` | all | Deployment stage (`poc`, `dev`, `staging`, `prod`). Affects resource names. |
| `SESFromEmail` / `FromEmail` | cognito, ses, notification-lambda, full-stack | Verified SES sender address. Must be verified before deploy. |
| `UserPoolId` | notification-lambda, full-stack | Cognito User Pool ID. Output from the cognito stack. |
| `DynamoDBTableName` | notification-lambda, full-stack | DynamoDB table holding user profiles (PK=`USER#<id>`, SK=`PROFILE`). |
| `NotificationTopicArn` | notification-lambda, full-stack | SNS topic that triggers the notification Lambda. |
| `TemplatesBucketName` | full-stack | S3 bucket that holds packaged nested-stack YAML files (after `cfn package`). |
| `FrontendAppName` | full-stack | AppName forwarded to the frontend-site nested stack. Default: `cj-web`. |

---

## Environment variables for the frontend

Copy `.env.example` at the project root to `.env.local` and fill in the values obtained from the Cognito stack outputs:

```bash
VITE_COGNITO_USER_POOL_ID=<UserPoolId output>
VITE_COGNITO_APP_CLIENT_ID=<UserPoolClientId output>
VITE_COGNITO_DOMAIN=<UserPoolDomain output>
```

---

## Teardown

```bash
# Individual stacks (reverse deployment order)
aws cloudformation delete-stack --stack-name career-jump-notification-poc --region us-east-1
aws cloudformation delete-stack --stack-name career-jump-ses-poc          --region us-east-1
aws cloudformation delete-stack --stack-name career-jump-cognito-poc      --region us-east-1

# NOTE: The Cognito User Pool has DeletionProtection: ACTIVE.
# Disable it first via the console or CLI, then delete the stack.
aws cognito-idp update-user-pool \
  --user-pool-id <UserPoolId> \
  --deletion-protection INACTIVE \
  --region us-east-1
```

---

## Security notes

- The Cognito User Pool has `DeletionProtection: ACTIVE` – this prevents accidental deletion in production. Disable it manually before running `delete-stack`.
- SES is scoped to send only from the verified `FromEmail` address via an IAM condition (`ses:FromAddress`).
- DynamoDB access in the Lambda role is scoped to the single table and its GSIs only.
- SSM parameter access in the Lambda role is scoped to the `/${AppName}/${Stage}/notification/*` path.
- Never commit `.env.local` or any file containing Cognito IDs, SES credentials, or ARNs to version control.
