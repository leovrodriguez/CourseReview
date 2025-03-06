import os

# Environment Variables (Default to test environment)
# See README.md for more information
FORCE_PARSE = os.getenv("FORCE_PARSE", "false").lower() == "true"
AVOID_PARSE_COURSERA = os.getenv("AVOID_PARSE_COURSERA", "false").lower() == "true"
AVOID_PARSE_UDEMY = os.getenv("AVOID_PARSE_UDEMY", "false").lower() == "true"
FORCE_INSERT = os.getenv("FORCE_INSERT", "false").lower() == "true"