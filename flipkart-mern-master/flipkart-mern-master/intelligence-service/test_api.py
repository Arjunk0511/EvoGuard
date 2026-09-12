import requests

response = requests.post(
    "http://localhost:5001/anomaly",
    json={
        "features": [
            4,5,10,5,1,0,90,22,17 
            #80,30,15,5,1,0,90,40,80

            #request,endpoints,failedattempts,sql pattern,xss,traversal,user,session.
        ]
    }
)

print(response.json())
