use django on the backend


the backend system:
- upload file and store in s3
    - if the file is not a valid CSV it will just error out
- file in s3 is wiped after 24 hours
- return the file data in an endpoint
- endpoint for AI to suggest column parsing
- parse column endpoint
    - it is a bulk endpoint, column name + type as input
- splink for deduplication
