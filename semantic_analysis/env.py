import os

# Environment Variables (Default to test environment)
# See README.md for more information
FORCE_PARSE = os.getenv("FORCE_PARSE", "false").lower() == "true"
FORCE_EMBED = os.getenv("FORCE_EMBED", "false").lower() == "true"