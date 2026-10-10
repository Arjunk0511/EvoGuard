import requests

response = requests.post(
    "http://localhost:5001/anomaly",
    json={
        "features": [10] * 78
    }
)

print(response.json())