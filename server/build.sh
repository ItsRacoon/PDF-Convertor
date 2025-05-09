
# Install system dependencies
apt-get update && apt-get install -y \
  ghostscript \
  default-jre \
  libgl1 \
  libglib2.0-0 \
  poppler-utils

# Install Python dependencies
pip install -r requirements.txt
