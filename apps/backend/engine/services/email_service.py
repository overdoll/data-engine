import requests
from django.conf import settings
from typing import Dict, Any, Optional


class EmailService:
    def __init__(self):
        self.api_key = settings.LOOPS_API_KEY
        self.base_url = "https://app.loops.so/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def send_transactional_email(
        self,
        transactional_id: str,
        email: str,
        data: Optional[Dict[str, Any]] = None,
        add_to_audience: bool = False,
    ) -> Dict[str, Any]:
        """
        Send a transactional email using Loops.so API

        Args:
            transactional_id: The ID of the transactional email template
            email: Recipient's email address
            data: Optional dictionary of variables to use in the email template
            add_to_audience: Whether to add the recipient to your audience

        Returns:
            API response as dictionary

        Raises:
            requests.exceptions.RequestException: If the API request fails
        """
        payload = {"email": email, "transactionalId": transactional_id}

        if data:
            payload["dataVariables"] = data

        if add_to_audience:
            payload["addToAudience"] = True

        response = requests.post(
            f"{self.base_url}/transactional", headers=self.headers, json=payload
        )

        response.raise_for_status()
        return response.json()
