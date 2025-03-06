import requests
import json
import os
import subprocess
from time import sleep
from .course import COURSERA_DIR, UDEMY_DIR
from env import FORCE_PARSE

"""
Core logic for web scraping. Makes requests to exposed apis and saves raw data to a file.
"""

def write_raw_data():
  """
  Saves all raw data to a file in the data directory into a respective sub directory (e.g data/coursera/)
  """
  # save_coursera_raw_data()
  save_udemy_raw_data()

def save_udemy_raw_data():
  """
  Saves raw data from udemy to a file in the data directory: data/udemy/all_entries.json

  NOTE: Udemy web scraping allows us to grab a page by page, so we go until there is an error with the page number or page return is empty
  """
  if not FORCE_PARSE:
     print("Not parsing raw data. Raw data persisted in docker volume. To force a restart run: FORCE_PARSE=true docker-compose up ")
     return

  # get the pages with the courses
  courses = get_udemy_pages()

  if courses:
    print(f"Found {len(courses)} courses from udemy")
  
  os.makedirs(UDEMY_DIR, exist_ok=True)
  with open(os.path.join(UDEMY_DIR, 'all_entries.json'), 'w') as file:
      json.dump(courses, file, indent=2) 
      print(f"Wrote raw data to {UDEMY_DIR}/all_entries.json")

def get_udemy_pages():
    # stores the raw data
    all_courses = []
    # page count
    page_count = 1

    # loop through until there is an error with the page number
    while True:
        page_output = None
        # attempt reading this page ten times
        for i in range(10):
            page_output = udemy_curl_page(page_count)
            if page_output is not None:
                break
        if page_output is None:
            print(f"Failed to get page {page_count}")
            break

        # direct string check for empty response or empty courses array
        if '"courses": []' in page_output or '"count": 0' in page_output:
            print(f"Page {page_count} has no courses")
            break
        
        # parse the page output as JSON
        try:
            page_data = json.loads(page_output)
        except json.JSONDecodeError:
            print(f"Error decoding JSON on page {page_count}. Exiting.")
            break

        # extract the courses from the current page
        courses = page_data.get('courses', [])
        
        # append each course from the page to the all_courses list
        all_courses.extend(courses) 

        # increment page count
        page_count += 1

    return all_courses

def get_udemy_page_curl_request(page_number):
    # Define the curl command as a string
    curl_command = f"""
        curl --location 'https://www.udemy.com/api-2.0/search-courses/?p={page_number}&src=ukw&q=course&skip_price=true' \
        --header 'referer: https://www.udemy.com/courses/search/?src=ukw&q=course' \
        --header 'sec-fetch-dest: empty' \
        --header 'sec-fetch-mode: cors' \
        --header 'sec-fetch-site: same-origin' \
        --header 'x-requested-with: XMLHttpRequest' \
        --header 'x-udemy-cache-brand: USen_US' \
        --header 'x-udemy-cache-campaign-code: ST16MT28125BUS' \
        --header 'x-udemy-cache-device: None' \
        --header 'x-udemy-cache-language: en' \
        --header 'x-udemy-cache-logged-in: 0' \
        --header 'x-udemy-cache-marketplace-country: US' \
        --header 'x-udemy-cache-price-country: US' \
        --header 'x-udemy-cache-release: 5da045330fd7fbb83fa0' \
        --header 'x-udemy-cache-user: ' \
        --header 'x-udemy-cache-version: 1' \
        --header 'Cookie: __udmy_2_v57r=74d503e57c964b5da347b203eb1741f3; evi="3@7xBENrVQ8N6AUthfECgZzxYKzYgdC7l0Y3O966YFHoqp8_rjD-Zxzmdx"; ud_rule_vars="eJx1jcsKgzAURH9Fsm2Vm6eYbwmEGK82VBqaRDfivzfQFropzOowZ-YgxaUFC052DzmUmHQvJgkcZe8HJUY5OS76kVUy0l7QmWsf4z0g0Q05DJlDyuXt2skVNJUbwoDJFngLogGqBWipOi6kGsQFQAMYcq2t1VW1xM3fbElunoO3OW7Jo91dCm5cP2sxLe4R_I-U8Llh_vfINWU1HWNKKv59PMn5AoBvR5Q=:1tpIhY:zWkQ2AwMcuIir0NcFxqWo1X3OQj18KcBl1z-FD_eolo"'
        """
    return curl_command

def udemy_curl_page(page_number):
    try:
        # get the curl command
        curl_command = get_udemy_page_curl_request(page_number)
        # Execute the curl command
        response = subprocess.run(curl_command, shell=True, text=True, capture_output=True)
        return response.stdout
    except subprocess.CalledProcessError as e:
        print("Error getting curl page for page number ", page_number)
        return None

def save_coursera_raw_data():
  """
  Saves raw data from coursera to a file in the data directory: data/coursera/all_entries.json

  NOTE: Coursera web scraping allows us to grab 10000 courses so we only need to make one request to get all courses. Other platforms can vary.
  """

  payload = json.dumps([
    {
      "operationName": "Search",
      "variables": {
        "requests": [
          {
            "entityType": "PRODUCTS",
            "limit": 10,
            "maxValuesPerFacet": 1000,
            "facetFilters": [],
            "cursor": "0",
            "query": ""
          }
        ]
      },
      "query": "query Search($requests: [Search_Request!]!) {\n  SearchResult {\n    search(requests: $requests) {\n      elements {\n        ... on Search_ArticleHit {\n          aeName\n          careerField\n          category\n          createdByName\n          firstPublishedAt\n          id\n          internalContentEpic\n          internalProductLine\n          internalTargetKw\n          introduction\n          islocalized\n          lastPublishedAt\n          localizedCountryCd\n          localizedLanguageCd\n          name\n          subcategory\n          topics\n          url\n          skill: skills\n          __typename\n        }\n        ... on Search_ProductHit {\n          avgProductRating\n          cobrandingEnabled\n          completions\n          duration\n          id\n          imageUrl\n          isCourseFree\n          isCreditEligible\n          isNewContent\n          isPartOfCourseraPlus\n          name\n          numProductRatings\n          parentCourseName\n          parentLessonName\n          partnerLogos\n          partners\n          productCard {\n            ...SearchProductCard\n            __typename\n          }\n          productDifficultyLevel\n          productDuration\n          productType\n          skills\n          url\n          videosInLesson\n          translatedName\n          translatedSkills\n          translatedParentCourseName\n          translatedParentLessonName\n          __typename\n        }\n        ... on Search_SuggestionHit {\n          id\n          name\n          score\n          __typename\n        }\n        __typename\n      }\n      facets {\n        name\n        valuesAndCounts {\n          count\n          value\n          __typename\n        }\n        __typename\n      }\n      pagination {\n        cursor\n        totalElements\n        __typename\n      }\n      totalPages\n      source {\n        indexName\n        recommender {\n          context\n          hash\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SearchProductCard on ProductCard_ProductCard {\n  id\n  canonicalType\n  marketingProductType\n  productTypeAttributes {\n    ... on ProductCard_Specialization {\n      isPathwayContent\n      __typename\n    }\n    ... on ProductCard_Course {\n      isPathwayContent\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n"
    }
  ])
  headers = {
    'Content-Type': 'application/json'
  }

  url = "https://www.coursera.org/graphql-gateway?opname=Search"
  session = requests.Session()
  session.get("https://www.coursera.org")

  #Given long request time, requests can fail due to timeout. Increase attempt count if issues continue
  for attempt in range(10):
    response = session.post(url, headers=headers, data=payload, timeout=100)
    response_data = response.json()
    if response_data[0].get("errors"):
        print(f"Attempt {attempt + 1} to save raw data failed")
        continue
    
    print(f"Attempt {attempt + 1} to save raw data successful")
    os.makedirs(COURSERA_DIR, exist_ok=True)
    with open(os.path.join(COURSERA_DIR, 'all_entries.json'), 'w') as file:
        file.write(response.text)
        print(f"Wrote raw data to {COURSERA_DIR}/all_entries.json")
    break