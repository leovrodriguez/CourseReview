 # Course Review Platform


 ## Architecture

 ```mermaid
flowchart TD
    A@{ shape: cyl, label: "Database" }
    B(Front End)
    C(Data Layer API 
        )
    D(Semantic Analysis Job)

    B <-- retrieve and post user data -----> C
    D -.manual runs to store platform course data....-> C
    C <---> A
```



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

