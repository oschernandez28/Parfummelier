from flask import Blueprint, request, jsonify, abort
from typing import List, Dict
import requests
import os
import logging

logger = logging.getLogger(__name__)

PRODUCT_API_URL_QUIZ_SERVICES = os.getenv(
    "PRODUCT_API_URL", "http://product-service:5000"
)

quiz_blueprint = Blueprint("quiz", __name__)


@quiz_blueprint.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Quiz Service launched"}), 200


# In-memory dictionary for user accordbanks
user_accordbanks: Dict[int, List[str]] = {}


# Mapping of answers to corresponding accords
ANSWER_TO_ACCORDS = {
    "Reading a book in a cozy nook": ["Powdery", "Amber", "Woody"],
    "Watching your favorite series with a snack": ["Sweet", "Aromatic", "Nutty"],
    "Meditating or practicing yoga": ["Earthy", "Balsamic", "Lavender"],
    "Cooking up a new recipe": ["Herbal", "Spicy", "Bitter"],
    "Upbeat pop that makes you dance": ["Fruity", "Tropical", "Citrus"],
    "Classic rock with guitar riffs": ["Leather", "Warm Spicy", "Tobacco"],
    "Soothing classical music": ["Iris", "White Floral", "Floral"],
    "Jazzy tunes with a laid-back vibe": ["Soft Spicy", "Patchouli", "Mossy"],
    "A freshly brewed cup of coffee": ["Coffee", "Caramel", "Chocolate"],
    "A calming cup of herbal tea": ["Green", "Soapy", "Fresh"],
    "A glass of rich red wine": ["Mossy", "Oud", "Honey"],
    "A refreshing mojito cocktail": ["Rum", "Salty", "Mint"],
    "Sunrise, when the world feels fresh and quiet": [
        "Ozonic",
        "Fresh Spicy",
        "Aldehydic",
    ],
    "Mid-afternoon, when the sun is warm but not too hot": [
        "Lactonic",
        "Citrus",
        "Marine",
    ],
    "Early evening, just before the stars come out": ["Rose", "Powdery", "Camphor"],
    "Late at night, when everything feels calm": ["Musky", "Mineral", "Beeswax"],
    "A classic Italian pasta dish": ["Animalic", "Savory", "Earthy"],
    "Spicy and flavorful Mexican food": ["Cinnamon", "Smoky", "Peppery"],
    "French pastries and delicate desserts": ["Vanilla", "Almond", "Cacao"],
    "Fresh and simple Japanese cuisine": ["Aquatic", "Green", "Rice"],
    "Hiking in the mountains or by the beach": ["Conifer", "Amber", "Sand"],
    "Going to a live concert or music festival": ["Metallic", "Rum", "Leather"],
    "Treating yourself to a spa day": ["Floral", "Soapy", "Tuberose"],
    "Exploring new cafes or hidden spots in the city": ["Coffee", "Nutty", "Woodsy"],
    "A loyal and playful dog": ["Musky", "Honey", "Soft Spicy"],
    "An independent and mysterious cat": ["Animalic", "Patchouli", "Violet"],
    "A colorful bird that sings all day": ["Fruity", "Citrus", "Yellow Floral"],
    "A calm fish that swims gracefully": ["Aquatic", "Salty", "Marine"],
    "Relaxing on a secluded tropical island": ["Coconut", "Tropical", "Fresh"],
    "Skiing in the snowy mountains": ["Icy", "Woody", "Powdery"],
    "Exploring a bustling city like New York": ["Industrial Glue", "Amber", "Concrete"],
    "Strolling through romantic Paris streets": ["Rose", "Powdery", "Floral"],
    "Spring, when everything blooms": ["Floral", "Green", "Fresh"],
    "Summer, with endless sunny days": ["Citrus", "Tropical", "White Floral"],
    "Fall, with cozy vibes and colorful leaves": ["Warm Spicy", "Herbal", "Earthy"],
    "Winter, when it’s all about warmth and hot cocoa": [
        "Vanilla",
        "Cinnamon",
        "Nutty",
    ],
    "Action-packed superhero adventure": ["Black Pepper", "Leather", "Smoky"],
    "A lighthearted romantic comedy": ["Sweet", "Fruity", "Soft Spicy"],
    "A mystery that keeps you on the edge of your seat": ["Earthy", "Woody", "Dark"],
    "A fantasy with magical creatures and faraway lands": ["Musk", "Green", "Amber"],
}


@quiz_blueprint.route("/submit-quiz", methods=["POST"])
def submit_quiz():
    """
    Combines quiz submission and accord synchronization using internal Docker networking
    """
    # Get authorization token from request headers
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization token is required"}), 401

    # Get and validate quiz data
    data = request.json
    answers = data.get("answers", [])
    if len(answers) != 10:
        return jsonify({"error": "Quiz must have exactly 10 answers"}), 400

    try:
        # Process answers to get unique accords
        accordbank_set = set()
        for answer in answers:
            if answer not in ANSWER_TO_ACCORDS:
                return jsonify({"error": f"Invalid answer: {answer}"}), 400
            accordbank_set.update(ANSWER_TO_ACCORDS[answer])

        # Convert set to list for the request
        accordbank = list(accordbank_set)

        # Use internal Docker network URL (service_name:internal_port/path)
        user_service_url = "http://user-service:5000/scentbank/accords"

        logger.debug(f"Sending request to : {user_service_url}")
        logger.debug(f"Request payload: {{'favorite_accords': {accordbank}}}")
        logger.debug(f"Request headers: {auth_header}")

        # Forward the request with the original authorization token
        response = requests.put(
            user_service_url,
            json={"favorite_accords": accordbank},
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
        )

        logger.debug(f"Response status code: {response.status_code}")
        logger.debug(f"Response content: {response.text}")

        if response.status_code == 201:
            return (
                jsonify(
                    {
                        "message": "Quiz submitted and accords synced successfully",
                        "accordbank": accordbank,
                    }
                ),
                201,
            )
        else:
            try:
                error_response = response.json()
            except ValueError:
                error_response = {"error": response.text}
            return jsonify(error_response), response.status_code

    except requests.RequestException as e:
        logger.error(f"Server Errror : {e}")
        logger.error(
            f"Response details (if any): {getattr(e.response, 'text', 'No response text')}"
        )
        return (
            jsonify({"error": f"Failed to sync accords with user service: {str(e)}"}),
            500,
        )


@quiz_blueprint.route("/accord-data/", methods=["POST"])
def get_accord_data():
    accordbank = request.json.get("accordbank", [])
    accords = list(set(accordbank))
    return jsonify(accords)


# NOTE: what does this do ?
@quiz_blueprint.route("/update-accordbank/<int:user_id>", methods=["PUT"])
def update_accordbank(user_id):
    data = request.json
    answers = data.get("answers", [])

    if len(answers) != 10:
        abort(400, description="Quiz must have exactly 10 answers.")

    # Using a set to store unique accords for the updated accordbank
    updated_accordbank_set = set()
    for answer in answers:
        if answer not in ANSWER_TO_ACCORDS:
            abort(400, description=f"Invalid answer: {answer}")
        updated_accordbank_set.update(ANSWER_TO_ACCORDS[answer])

    # Convert set back to list for storage
    updated_accordbank = list(updated_accordbank_set)

    # Update the user's accordbank in memory
    user_accordbanks[user_id] = updated_accordbank

    return jsonify(
        {
            "message": "Accordbank updated successfully",
            "updated_accordbank": updated_accordbank,
        }
    )


# getting accord from the user
def get_recommendations_for_user(accordbank):
    url = f"{PRODUCT_API_URL_QUIZ_SERVICES}/recommendations"
    response = requests.post(url, json={"accordbank": accordbank})

    if response.status_code == 200:
        return response.json()  # Ensure this is returning the full response
    else:
        raise Exception(f"Failed to fetch recommendations: {response.text}")


# NOTE: getting recommendation
@quiz_blueprint.route("/get-recommendations/", methods=["POST"])
def get_recommendations():
    data = request.json
    accordbank = data.get("accordbank", [])

    if not accordbank:
        abort(400, description="Accord bank data is required.")

    try:
        # Call product-service to get recommendations based on the accordbank
        recommendations = get_recommendations_for_user(accordbank)
        return jsonify({"recommendations": recommendations})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@quiz_blueprint.errorhandler(400)
def bad_request(error):
    response = jsonify({"description": error.description})
    response.status_code = 400
    return response


@quiz_blueprint.route("/sync-user-accords/<int:user_id>", methods=["PUT"])
def sync_user_accords(user_id):
    """
    Syncs user_accordbank data with the user's favorite accords in user-service.
    """
    try:
        # Retrieve the user's accordbank from memory
        accordbank = user_accordbanks.get(user_id)
        if not accordbank:
            abort(404, description="No accordbank found for the user.")

        # Send a request to the user-service to update favorite accords
        user_service_url = f"http://user-service:5000/scentbank/accords"
        response = requests.put(
            user_service_url,
            json={"favorite_accords": accordbank},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 201:
            return jsonify({"message": "Favorite accords synced successfully."}), 201
        else:
            return jsonify({"error": response.json()}), response.status_code

    except requests.RequestException as e:
        return jsonify({"error": f"Failed to sync accords: {str(e)}"}), 500
