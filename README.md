 # Course Review Platform

 ## Running Docker Containers
if modifying dependencies:
```docker-compose -d build```

if just editing python code:
```docker build -d -t {service name} {relative service directory}```

to run:
```docker-compose -d up```

to clear up space (would recommend doing this at least at the end of every coding session):
```docker system prune -a```

NOTE: if you installed docker but docker-compose not found try 'docker compose' instead of 'docker-compose'