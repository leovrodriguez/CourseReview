# Semantic Analysis
This service is meant to create a semantic representation of courses for our website searches. 

## Flags
The service uses several environment variables to control its behavior. These variables can be set in the .env file or directly in the docker-compose.yml file.

- FORCE_PARSE (default: false):
    - If set to true, the service will force re-parsing of raw data even if it is already stored in volumes.
    - Example: FORCE_PARSE=true

- FORCE_EMBED (default: false):
    - If set to true, the service will force re-embedding of course objects even if they are already stored in volumes.
    - Example: FORCE_EMBED=true

- DB_IMPLEMENTATION (default: sqlite):

    - Specifies the type of database to use. Currently, only sqlite is supported.
    - Example: DB_IMPLEMENTATION=sqlite

- DB_PATH (default: /job/semantic_analysis/data/semantic_analysis.db):
    - Specifies the path to the database file (only relevant when one is being used).
    - Example: DB_PATH=/job/semantic_analysis/data/semantic_analysis.db


## Developing
Given the nature of how much data is being processed and what takes longest, do the following to save time:
- limit the courses parsed by lowering the limit in requests found at data_utils/save_raw_data.py (make sure FORCE_PARSE=TRUE)
    - after this you can let FORCE_PARSE default to false since the data will be saved in a docker volume

An example workflow for a fresh start with developing on top of this service
Pre Reqs: docker
1. Clone the repository
2. Limit the number of courses to parse in data_utils/save_raw_data.py (eventually these are also embedded)
3. run `FORCE_EMBED=true FORCE_PARSE=true docker-compose up -d --remove-orphans --build`

