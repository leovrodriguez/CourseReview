# Course Data ETL
This service is meant to (E)xtract course data from course platforms, (T)ransform that data into consistent Course objects across different course websites, then (L)oad that data into our database via our data layer api. 

The flow of data is:
1. API calls to retrieve course data in a raw json format which is then written to a local directory persisted in a docker volume (Omitted when FORCE_PARSE=FALSE)
2. The raw data is then normalized into Course objects in order to format and store the relevant data.
3. These course objects are then sent to the data layer to be stored into our database (Omitted when FORCE_INSERT=FALSE)
4. (TEST DEVELOPMENT BEHAVIOR) The final step that happens is we run some test queries based on the courses which are now stored in the database. The query is expected to be similar to that of a search on the website, hence it is a string which is processed in the datalayer to understand that query semantically and search for the most relevant semantically similar courses.

## Developing
The service uses several environment variables to control its behavior. These variables can be set in the .env file and are defaulted directly in the docker-compose.yml file.

- FORCE_PARSE (default: false):
    - If set to true, the service will force re-parsing of raw data in API calls even if it is already stored in volumes.
    - When false, we expect the raw data API payloads to be stored in the volumes and we will not re-parse that data into Course objects.

- FORCE_INSERT (default: false):
    - If set to true, the service will make calls to the data_layer API to insert the Courses into the database.
    - When false, we will not make calls to the data_layer API to insert the Courses into the database.

### Getting Started:

Pre-requisites:
1. Clone repository
2. Install Docker and Docker Compose

To run the ETL:
1. Given the nature of the time it takes to embed courses, when developing or testing limit the courses parsed by lowering the limit in requests found at data_utils/save_raw_data.py
3. run `FORCE_INSERT=TRUE FORCE_PARSE=TRUE docker-compose up course_data_etl -d --remove-orphans --build`
    - this runs just the course_data_etl service and forces parsing and inserting of the data
4. On future runs, the data should already be parsed and inserted, so you can run `docker-compose up course_data_etl -d --remove-orphans` to just run the service without re-parsing and re-inserting the data (bc relevant flags are defaulted false). This will simply give you the resulting courses from the queries in test/test_queries.py 

## Next Steps

Eventually, we want this job to also be responsible for keeping the data up to date. This will involve not only insertions but also updates and deletions. This will be a more complex process and will require more complex logic to determine what has changed in the course data.