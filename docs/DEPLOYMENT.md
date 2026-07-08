# Production Deployment Guide — Docker on AWS

This app is a static React SPA served by nginx; **Supabase is the entire backend**
(database, auth, RLS). The container has no server-side secrets:

- The **anon key is public by design** — it is baked into the JS bundle and RLS
  policies are the actual security boundary.
- The **service role key must never** appear in the image, build args, or task
  definition. It is only for the local `pnpm seed` script.

```
Browser ──HTTPS──> nginx container (App Runner / ECS)   ← this repo
   │
   └────HTTPS──> https://<project-ref>.supabase.co      ← auth + data (RLS)
```

> Because Vite inlines `VITE_*` variables at **build time**, the image is
> environment-specific. Building for staging vs production means building the
> image twice with different `--build-arg` values.

---

## 1. Build the image

```sh
docker build \
  --build-arg VITE_SUPABASE_URL="https://<project-ref>.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="<anon-key>" \
  -t kanban-board:latest .
```

### Test locally

```sh
docker run --rm -p 8080:80 kanban-board:latest
```

- `http://localhost:8080` → login page loads
- `http://localhost:8080/healthz` → `ok` (used by AWS health checks)
- `http://localhost:8080/projects` → serves the SPA (deep-link fallback works)
- Sign in and confirm data loads from Supabase.

---

## 2. Push to Amazon ECR

Prereqs: [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
configured (`aws configure`) with permissions for ECR (and App Runner or ECS below).

```sh
export AWS_REGION=ap-south-1                 # pick your region
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kanban-board

# one-time: create the repository
aws ecr create-repository \
  --repository-name kanban-board \
  --image-scanning-configuration scanOnPush=true \
  --region $AWS_REGION

# login, tag, push
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker tag kanban-board:latest $ECR_REPO:latest
docker tag kanban-board:latest $ECR_REPO:$(git rev-parse --short HEAD)   # immutable tag
docker push --all-tags $ECR_REPO
```

> Always deploy the **git-SHA tag**, not `latest` — rollbacks become trivial.

---

## 3A. Deploy with AWS App Runner (recommended)

Simplest path: HTTPS, autoscaling, health checks and a public domain out of the
box. No VPC/ALB to manage.

One-time IAM role so App Runner can pull from ECR:

```sh
aws iam create-role --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "build.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }'
aws iam attach-role-policy --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

Create the service:

```sh
aws apprunner create-service \
  --service-name kanban-board \
  --region $AWS_REGION \
  --source-configuration '{
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::'$AWS_ACCOUNT_ID':role/AppRunnerECRAccessRole"
    },
    "AutoDeploymentsEnabled": true,
    "ImageRepository": {
      "ImageIdentifier": "'$ECR_REPO':latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": { "Port": "80" }
    }
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/healthz",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 3
  }' \
  --instance-configuration '{ "Cpu": "0.25 vCPU", "Memory": "0.5 GB" }'
```

Get the URL (takes a few minutes to go `RUNNING`):

```sh
aws apprunner list-services --region $AWS_REGION \
  --query "ServiceSummaryList[?ServiceName=='kanban-board'].[ServiceUrl,Status]"
```

With `AutoDeploymentsEnabled: true`, every push to `:latest` in ECR
redeploys automatically. Custom domain: App Runner console → *Custom domains*
(certificates are provisioned for you).

---

## 3B. Alternative: ECS Fargate + ALB

More moving parts, more control (VPC placement, WAF, mixed workloads). Skip if
App Runner suffices.

1. **Cluster:** `aws ecs create-cluster --cluster-name kanban`
2. **Task definition** (`task-def.json` — nginx serves static files; 256/512 is plenty):

   ```json
   {
     "family": "kanban-board",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
     "containerDefinitions": [{
       "name": "web",
       "image": "<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/kanban-board:<GIT_SHA>",
       "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
       "healthCheck": {
         "command": ["CMD-SHELL", "wget -qO- http://127.0.0.1/healthz || exit 1"],
         "interval": 30, "timeout": 5, "retries": 3
       },
       "logConfiguration": {
         "logDriver": "awslogs",
         "options": {
           "awslogs-group": "/ecs/kanban-board",
           "awslogs-region": "<REGION>",
           "awslogs-stream-prefix": "web",
           "awslogs-create-group": "true"
         }
       }
     }]
   }
   ```

   `aws ecs register-task-definition --cli-input-json file://task-def.json`
3. **ALB:** internet-facing ALB + target group (target type `ip`, port 80,
   health check path `/healthz`) + HTTPS listener with an ACM certificate;
   redirect HTTP→HTTPS.
4. **Service:**

   ```sh
   aws ecs create-service --cluster kanban --service-name kanban-board \
     --task-definition kanban-board --desired-count 2 --launch-type FARGATE \
     --network-configuration 'awsvpcConfiguration={subnets=[subnet-...],securityGroups=[sg-...],assignPublicIp=ENABLED}' \
     --load-balancers 'targetGroupArn=arn:...,containerName=web,containerPort=80'
   ```

   Security groups: ALB allows 80/443 from the internet; tasks allow 80 from
   the ALB's security group only.
5. **Deploys:** push a new image tag, register a new task-definition revision,
   `aws ecs update-service --force-new-deployment`.

---

## 4. Supabase production checklist

Do these in the [dashboard](https://supabase.com/dashboard) before going live:

- [ ] **Auth → URL Configuration:** set *Site URL* to your deployed domain and
      add it to *Redirect URLs* (password-recovery/magic links break otherwise).
- [ ] **Auth → Sign In/Up:** **re-enable "Confirm email"** — it is currently
      disabled for dev convenience, which lets anyone sign up with a fake email.
      Configure custom SMTP (Auth → SMTP) — the built-in mailer is limited to
      ~3 emails/hour.
- [ ] **Revoke leaked/one-off credentials:** any personal access token
      (`sbp_…`) shared during setup, and rotate the service role key if it ever
      left your machine.
- [ ] **Backups:** verify PITR / daily backups are enabled for your plan.
- [ ] Confirm RLS is still enforced: `curl https://<ref>.supabase.co/rest/v1/projects?select=id -H "apikey: <anon>"`
      must return `[]`, never data, when unauthenticated.

---

## 5. CI/CD (optional): GitHub Actions → ECR → App Runner

`.github/workflows/deploy.yml` sketch — store `AWS_ROLE_ARN` (OIDC) plus
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as repo secrets/vars:

```yaml
name: deploy
on: { push: { branches: [main] } }
permissions: { id-token: write, contents: read }
jobs:
  build-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-south-1
      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - run: |
          IMAGE=${{ steps.ecr.outputs.registry }}/kanban-board
          docker build \
            --build-arg VITE_SUPABASE_URL="${{ vars.VITE_SUPABASE_URL }}" \
            --build-arg VITE_SUPABASE_ANON_KEY="${{ vars.VITE_SUPABASE_ANON_KEY }}" \
            -t $IMAGE:latest -t $IMAGE:${GITHUB_SHA::7} .
          docker push --all-tags $IMAGE
      # App Runner with AutoDeploymentsEnabled picks up :latest automatically
```

---

## Notes

- **Cost reality check:** this is a static SPA — S3 + CloudFront would serve it
  for cents/month with no containers at all. The Docker/App Runner path is the
  right call if you want container parity across environments or plan to add a
  server later; otherwise consider the static path.
- **Scaling:** the container is stateless (all state lives in Supabase), so
  horizontal scaling is safe by default.
- **Rollback:** App Runner → *Deployments* → redeploy a previous image tag;
  ECS → point the service at the previous task-definition revision.
