 # Course Review Platform

 ## Running Docker Containers
if modifying dependencies:
```docker-compose build```

if just editing python code:
```docker build -t {service name} {relative service directory}```

to run:
```docker-compose up```

NOTE: if you installed docker but docker-compose not found try 'docker compose' instead

## Semantic Analysis
This service is meant to create a semantic representation of courses for our website searches. 

### Developing on top of this service
Given how much data processing happens, for dev purposes you can make the limit on the requests a smaller amount to test changes that don't depend on having large amounts of data.