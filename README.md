 # Course Review Platform


 ## Architecture

 ```mermaid
flowchart TD
    A@{ shape: cyl, label: "Database" }
    B(Front End)
    C(Data Layer API )
    D(Course Data ETL)
    E(Ollama Embedder)
    subgraph otel-lgtm
        F1(OpenTelemetry)
        F2@{shape: cyl, label: Prometheus}
        F3@{shape: cyl, label: Tempo}
        F5(Grafana UI)
    end

    B <-- retrieve and post user data -----> C
    D -.routine data aggregation and processing....-> C
    C <---> |query| A
    C ---> E
    C --> | telemetry data | F1
    F1 -->|export logs| F2
    F1 -->|export traces| F3
    F5 -->|query| F2
    F5 -->|query| F3
```

See ReadMe files in each service for more information on how to run and develop each service.

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

