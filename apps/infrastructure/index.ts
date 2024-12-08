import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as vercel from "@pulumiverse/vercel"
import * as cloudflare from "@pulumi/cloudflare"

// Configuration setup
const config = new pulumi.Config()
const stackName = pulumi.getStack()

// Create an S3 bucket for storage
const bucket = new aws.s3.Bucket(
  "data-engine-storage",
  {
    acl: "private",
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
      },
    },
    forceDestroy: false,
  },
  {
    protect: true,
  }
)

// Create a VPC for our backend
const vpc = new awsx.ec2.Vpc("wispbit-vpc", {
  numberOfAvailabilityZones: 2,
  natGateways: {
    strategy: "None",
  },
})

// Create an ECS cluster
const cluster = new aws.ecs.Cluster("wispbit-cluster", {})

// Create Cloudflare DNS record for the API
const zone = cloudflare.getZone({
  zoneId: "993c84055fd4659394f2d189000cb412",
  accountId: "c25e9243819d22d69d7117980fb38006",
})

const zoneId = zone.then((zone) => zone.id)

// Create target group first
const targetGroup = new aws.lb.TargetGroup("wispbit-tg", {
  port: 8000,
  protocol: "HTTP",
  targetType: "ip",
  vpcId: vpc.vpcId,
  healthCheck: {
    enabled: true,
    path: "/health/",
    protocol: "HTTP",
  },
})

// Then create the load balancer with the target group
const lb = new awsx.lb.ApplicationLoadBalancer("wispbit-lb", {
  subnetIds: vpc.publicSubnetIds,
  listeners: [
    {
      port: 443,
      protocol: "HTTPS",
      certificateArn:
        "arn:aws:acm:us-east-1:771779017151:certificate/94ec410d-29e8-4d30-b1a1-e14d0a91148c",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    },
    {
      port: 80,
      protocol: "HTTP",
      defaultActions: [
        {
          type: "redirect",
          redirect: {
            protocol: "HTTPS",
            port: "443",
            statusCode: "HTTP_301",
          },
        },
      ],
    },
  ],
})

// Create Cloudflare DNS record for the API
const apiRecord = new cloudflare.Record("api-record", {
  zoneId: zoneId,
  name: "api",
  type: "CNAME",
  content: lb.loadBalancer.dnsName,
  proxied: true,
})

// Create security group for the backend service
const backendSecurityGroup = new aws.ec2.SecurityGroup("wispbit-backend-sg", {
  vpcId: vpc.vpcId,
  description: "Security group for backend service",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 8000,
      toPort: 8000,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
})

// Create IAM role for the ECS task
const taskRole = new aws.iam.Role("wispbit-task-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  }),
})

// Attach policy to allow access to the S3 bucket
const taskRolePolicy = new aws.iam.RolePolicy("wispbit-task-role-policy", {
  role: taskRole,
  policy: bucket.arn.apply((bucketArn: string) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"],
          Resource: [bucketArn, `${bucketArn}/*`],
        },
      ],
    })
  ),
})

// Create ECR repository for backend container
const backendRepo = new awsx.ecr.Repository("wispbit-backend-repo", {
  forceDelete: true,
})

// Build and publish backend container image
const backendImage = new awsx.ecr.Image("wispbit-backend-image", {
  repositoryUrl: backendRepo.url,
  context: "../../apps/backend",
  platform: "linux/amd64",
  builderVersion: "BuilderBuildKit",
})

// Create a Fargate service for the Django backend
const backendService = new awsx.ecs.FargateService("wispbit-backend", {
  cluster: cluster.arn,
  taskDefinitionArgs: {
    container: {
      name: "backend",
      image: backendImage.imageUri,
      cpu: 256,
      memory: 512,
      essential: true,
      portMappings: [
        {
          containerPort: 8000,
          targetGroup: targetGroup,
        },
      ],
      environment: [
        { name: "DEBUG", value: "false" },
        { name: "AWS_STORAGE_BUCKET_NAME", value: bucket.id },
        { name: "AI_API_KEY", value: config.requireSecret("ai-api-key") },
        {
          name: "CLERK_JWT_PEM_PUBLIC_KEY",
          value: config.requireSecret("clerk-jwt-pem-public-key"),
        },
        { name: "CLERK_JWT_JWKS_URL", value: config.requireSecret("clerk-jwt-jwks-url") },
        { name: "SENTRY_DSN", value: config.requireSecret("sentry-dsn-backend") },
        { name: "LOOPS_API_KEY", value: config.requireSecret("loops-api-key") },
      ],
    },
    taskRole: {
      roleArn: taskRole.arn,
    },
  },
  desiredCount: 1,
  networkConfiguration: {
    assignPublicIp: true,
    subnets: vpc.publicSubnetIds,
    securityGroups: [backendSecurityGroup.id],
  },
})

const aRecord = new cloudflare.Record("a-record", {
  zoneId: zoneId,
  name: "@",
  type: "A",
  content: "76.76.21.21",
  proxied: true,
  allowOverwrite: true,
})

const wwwRecord = new cloudflare.Record("www-record", {
  zoneId: zoneId,
  name: "www",
  type: "CNAME",
  content: "cname.vercel-dns.com",
  proxied: false,
  allowOverwrite: true,
})

// Create Vercel project without the domains field
const vercelProject = new vercel.Project("wispbit-frontend", {
  framework: "nextjs",
  name: "wispbit",
  buildCommand: "bun run build",
  installCommand: "bun install",
  teamId: "team_qjGLQv9Fohre18coiyWEvZic",
})

// Add domains to Vercel project using Domain resource
const mainDomain = new vercel.ProjectDomain("main-domain", {
  projectId: vercelProject.id,
  domain: "wispbit.com",
})

const wwwDomain = new vercel.ProjectDomain("www-domain", {
  projectId: vercelProject.id,
  domain: "www.wispbit.com",
  redirect: "wispbit.com",
})

// Create Vercel deployment
const vercelDeployment = new vercel.Deployment("wispbit-deployment", {
  projectId: vercelProject.id,
  production: true,
  teamId: "team_qjGLQv9Fohre18coiyWEvZic",
  pathPrefix: "../../apps/frontend",
  files: vercel.getProjectDirectoryOutput({ path: "../../apps/frontend" }).files,
  environment: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: config.requireSecret("clerk-publishable-key"),
    CLERK_SECRET_KEY: config.requireSecret("clerk-secret-key"),
    NEXT_PUBLIC_API_URL: lb.loadBalancer.dnsName,
    SENTRY_DSN: config.requireSecret("sentry-dsn-frontend"),
    NEXT_PUBLIC_POSTHOG_KEY: config.requireSecret("posthog-key"),
    NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  },
})

// Add Clerk DNS records
const clerkFrontendApi = new cloudflare.Record("clerk-frontend-api", {
  zoneId: zoneId,
  name: "clerk",
  type: "CNAME",
  content: "frontend-api.clerk.services",
  proxied: false,
  allowOverwrite: true,
})

const clerkAccountsPortal = new cloudflare.Record("clerk-accounts-portal", {
  zoneId: zoneId,
  name: "accounts",
  type: "CNAME",
  content: "accounts.clerk.services",
  proxied: false,
  allowOverwrite: true,
})

// Email-related DNS records for Clerk
const clerkDkim1 = new cloudflare.Record("clerk-dkim1", {
  zoneId: zoneId,
  name: "clk._domainkey",
  type: "CNAME",
  content: "dkim1.3a1qpuehfbdh.clerk.services",
  proxied: false, // Email records should not be proxied
  allowOverwrite: true,
})

const clerkDkim2 = new cloudflare.Record("clerk-dkim2", {
  zoneId: zoneId,
  name: "clk2._domainkey",
  type: "CNAME",
  content: "dkim2.3a1qpuehfbdh.clerk.services",
  proxied: false,
  allowOverwrite: true,
})

const clerkMail = new cloudflare.Record("clerk-mail", {
  zoneId: zoneId,
  name: "clkmail",
  type: "CNAME",
  content: "mail.3a1qpuehfbdh.clerk.services",
  proxied: false,
  allowOverwrite: true,
})

// Loops Email Records
const loopsMxRecord = new cloudflare.Record("loops-mx", {
  zoneId: zoneId,
  name: "envelope",
  type: "MX",
  content: "feedback-smtp.us-east-1.amazonses.com",
  priority: 10,
  proxied: false,
  allowOverwrite: true,
})

const loopsSpfRecord = new cloudflare.Record("loops-spf", {
  zoneId: zoneId,
  name: "envelope",
  type: "TXT",
  content: "v=spf1 include:amazonses.com ~all",
  proxied: false,
  allowOverwrite: true,
})

const loopsDmarcRecord = new cloudflare.Record("loops-dmarc", {
  zoneId: zoneId,
  name: "_dmarc",
  type: "TXT",
  content: "v=DMARC1; p=none",
  proxied: false,
  allowOverwrite: true,
})

// DKIM Records
const loopsDkim1 = new cloudflare.Record("loops-dkim1", {
  zoneId: zoneId,
  name: "ddfjkzgmrf7tfaf45fdg2pjklsfaq2l3._domainkey",
  type: "CNAME",
  content: "ddfjkzgmrf7tfaf45fdg2pjklsfaq2l3.dkim.amazonses.com",
  proxied: false,
  allowOverwrite: true,
})

const loopsDkim2 = new cloudflare.Record("loops-dkim2", {
  zoneId: zoneId,
  name: "ozi4w5unozdbqm2lrrlbw52mb36ak2j5._domainkey",
  type: "CNAME",
  content: "ozi4w5unozdbqm2lrrlbw52mb36ak2j5.dkim.amazonses.com",
  proxied: false,
  allowOverwrite: true,
})

const loopsDkim3 = new cloudflare.Record("loops-dkim3", {
  zoneId: zoneId,
  name: "woa7beka37a7iuiresv5ayux6mu6s4ji._domainkey",
  type: "CNAME",
  content: "woa7beka37a7iuiresv5ayux6mu6s4ji.dkim.amazonses.com",
  proxied: false,
  allowOverwrite: true,
})

// AWS ACM
const awsAcmCname = new cloudflare.Record("wispbit-api-cname", {
  zoneId: zoneId,
  name: "_4eca1cb2398524dce5a4d238a669c93f.api.wispbit.com",
  type: "CNAME",
  content: "_594156f9a064c8f714e2b4d1756b5e81.zfyfvmchrl.acm-validations.aws",
  proxied: false,
  allowOverwrite: true,
})
