import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as vercel from "@pulumiverse/vercel"

// Configuration setup
const config = new pulumi.Config()
const stackName = pulumi.getStack()

// Create an S3 bucket for storage
const bucket = new aws.s3.Bucket("data-engine-storage", {
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
})

// Create a VPC for our backend
const vpc = new awsx.ec2.Vpc("wispbit-vpc", {
  numberOfAvailabilityZones: 2,
  natGateways: {
    strategy: "Single",
  },
})

// Create an ECS cluster
const cluster = new aws.ecs.Cluster("wispbit-cluster", {})

// Create a load balancer
const lb = new awsx.lb.ApplicationLoadBalancer("wispbit-lb", {
  subnetIds: vpc.privateSubnetIds,
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
          targetGroup: lb.defaultTargetGroup,
        },
      ],
      environment: [
        { name: "DEBUG", value: "false" },
        { name: "ALLOWED_HOSTS", value: "*" },
        { name: "AWS_STORAGE_BUCKET_NAME", value: bucket.id },
        { name: "AI_API_KEY", value: config.requireSecret("ai-api-key") },
        {
          name: "CLERK_JWT_PEM_PUBLIC_KEY",
          value: config.requireSecret("clerk-jwt-pem-public-key"),
        },
        { name: "CLERK_JWT_JWKS_URL", value: config.requireSecret("clerk-jwt-jwks-url") },
      ],
    },
    taskRole: {
      roleArn: taskRole.arn,
    },
  },
  desiredCount: 1,
  networkConfiguration: {
    assignPublicIp: true,
    subnets: vpc.privateSubnetIds,
    securityGroups: [backendSecurityGroup.id],
  },
})

// Vercel Project Configuration
const vercelProject = new vercel.Project("wispbit-frontend", {
  framework: "nextjs",
  name: "wispbit",
  rootDirectory: "../../apps/frontend",
  buildCommand: "bun run build",
})

// Create Vercel deployment
const vercelDeployment = new vercel.Deployment("wispbit-deployment", {
  projectId: vercelProject.id,
  production: true,
  files: vercel.getProjectDirectoryOutput({ path: "../../apps/frontend" }).files,
  environment: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: config.requireSecret("clerk-publishable-key"),
    CLERK_SECRET_KEY: config.requireSecret("clerk-secret-key"),
    API_URL: lb.loadBalancer.dnsName,
  },
})
