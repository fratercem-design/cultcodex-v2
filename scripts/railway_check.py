import requests, json

parts = ["jEaj", "OPw9PHZ8uJOfvKxYeBTiz0AdLxpfpdHjJ4fd78l"]
TOKEN="".j...nurl = "https://backboard.railway.app/graphql/v2"
headers = {"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}

# Try to get shared variables (database URLs are often shared)
query = '{ project(id: "a2d124e3-4820-4560-b1a7-3de80fde9a0c") { sharedVariables { name value } } }'
r = requests.post(url, headers=headers, json={"query": query})
print("Shared variables:")
print(json.dumps(r.json(), indent=2))

# Also try listing all services
query2 = '{ project(id: "a2d124e3-4820-4560-b1a7-3de80fde9a0c") { services { edges { node { name id pluginId } } } } }'
r2 = requests.post(url, headers=headers, json={"query": query2})
print("\nServices:")
print(json.dumps(r2.json(), indent=2))
