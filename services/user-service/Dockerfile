# Use an official python 
FROM python:3.9-slim

# Set the working directory 
WORKDIR /app 

# Copy the requirement.txt 
COPY requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code 
COPY . . 

# Expose the port that the Flask app will run on 
EXPOSE 5001

# Define the command to run the flask app 
CMD ["python3" , "run.py"]
