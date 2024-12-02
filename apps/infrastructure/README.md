# Install dependencies

`bun install`

# Set up pulumi

0. Install pulumi CLI
`brew install pulumi/tap/pulumi`

1. Login to pulumi ESC and enter your personal access token
`esc login`

2. Configure AWS - use your AWS account credentials
`aws configure --profile overdoll`

Region is `us-east-1`

# Deploy to production

Check resources to be created
`pulumi preview`

Deploy
`pulumi up`


# Destroy production resources

`pulumi destroy`


# Add a secret

`pulumi config set <key> <value>`

Secrets will be stored in `Pulumi.production.yaml`