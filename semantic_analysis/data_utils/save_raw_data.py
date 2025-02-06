import requests
import json
import os
from time import sleep
from .course import COURSERA_DIR

url = "https://www.coursera.org/graphql-gateway?opname=Search"
session = requests.Session()
session.get("https://www.coursera.org")
def write_raw_data():
    save_coursera_raw_data()
    # save_udemy_raw_data

def save_coursera_raw_data():
  payload = json.dumps([
    {
      "operationName": "Search",
      "variables": {
        "requests": [
          {
            "entityType": "PRODUCTS",
            "limit": 10000,
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

  #Given long request time, requests can fail due to timeout. Increase attempt count if issues continue
  for attempt in range(10):
    response = session.post(url, headers=headers, data=payload, timeout=100)
    response_data = response.json()
    if response_data[0].get("errors"):
        print(f"Attempt {attempt + 1} to save raw data failed")
        continue
    
    # print successful response
    print(f"Attempt {attempt + 1} to save raw data successful")
    os.makedirs(COURSERA_DIR, exist_ok=True)
    with open(os.path.join(COURSERA_DIR, 'all_entries.json'), 'w') as file:
        file.write(response.text)
    break