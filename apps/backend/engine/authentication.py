import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, DecodeError
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
from urllib.request import urlopen
import json
import logging
from functools import cache
import base64

logger = logging.getLogger(__name__)


class ClerkUser:
    def __init__(self, user_id, email=None, metadata=None):
        self.id = user_id
        self.email = email
        self.metadata = metadata or {}
        self.is_authenticated = True
        self.is_paid = self.metadata.get("is_paid", False)

    @property
    def is_anonymous(self):
        return False


@cache
def get_public_keys():
    url = settings.CLERK_JWT_JWKS_URL
    response = urlopen(url)
    data_json = json.loads(response.read())
    logger.debug(f"jwks url response: {data_json}")
    logger.debug(f"JWT Keys: {data_json['keys']}")
    return data_json["keys"]


class ClerkJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        try:
            # Extract the token
            auth_parts = auth_header.split(" ")
            if len(auth_parts) != 2 or auth_parts[0].lower() != "bearer":
                return None

            token = auth_parts[1]
            logger.debug(f"Decoding token {token}")

            # Verify the token using Clerk's PEM public key
            decoded = jwt.decode(
                token,
                key=base64.b64decode(settings.CLERK_JWT_PEM_PUBLIC_KEY),
                algorithms=["RS256"],
            )

            logger.debug(f"Decoded token data: {decoded}")

            # Extract metadata from custom claims
            metadata = {"is_paid": decoded.get("is_paid", False)}

            # Create a user instance with metadata
            user = ClerkUser(
                user_id=decoded.get("sub"),
                email=decoded.get("email"),
                metadata=metadata,
            )

            return (user, None)

        except ExpiredSignatureError:
            logger.error("Token has expired")
            raise exceptions.AuthenticationFailed("Token has expired")
        except DecodeError as e:
            logger.error(f"Token decode error: {str(e)}")
            raise exceptions.AuthenticationFailed("Invalid token format")
        except InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            raise exceptions.AuthenticationFailed("Invalid token")

    def authenticate_header(self, request):
        return "Bearer"
