from rest_framework.decorators import api_view
from rest_framework.response import Response


# Function-based view example
@api_view(["GET"])
def hello_world(request):
    return Response({"message": "Hello, world!"})
