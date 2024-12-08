from types import TracebackType
from flask_migrate import branches
from flask import Blueprint, request, jsonify, send_from_directory
from app.models import db, Product, Accord, Review
from sqlalchemy import func
from datetime import date
import os
import random
import logging

logger = logging.getLogger(__name__)


product_blueprint = Blueprint("product", __name__)

# NOTE:
# Define the path to images directory
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
IMAGES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")


# NOTE: Serve the images on the server
@product_blueprint.route("/images/<path:filename>")
def serve_image(filename):
    """
    serve images from the image directory
    """
    return send_from_directory(IMAGES_PATH, filename)


@product_blueprint.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Product Service launched"}), 200


# ----------------------------- #
#           PRODUCTS            #
# ----------------------------- #


# NOTE: Full List Products return
@product_blueprint.route("/products", methods=["GET"])
def list_products():
    products = Product.query.all()
    base_url = "http://api-gateway:8000/images/"  # Always use api-gateway

    return jsonify(
        [
            {
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "accords": [
                    {"name": accord.name, "background_color": accord.background_color}
                    for accord in product.accords
                ],
                "imageURL": (
                    f"{base_url}{product.imageURL.lstrip('/')}"
                    if product.imageURL
                    else None
                ),
            }
            for product in products
        ]
    )


# NOTE: Single product return
@product_blueprint.route("/product/<string:name>", methods=["GET"])
def get_product(name):
    product = Product.query.filter_by(name=name).first_or_404()
    base_url = "http://api-gateway:8000/images/"

    return jsonify(
        {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "description": product.description,
            "accords": [
                {"name": accord.name, "background_color": accord.background_color}
                for accord in product.accords
            ],
            "imageURL": base_url + product.imageURL if product.imageURL else None,
        }
    )


# NOTE: Add Product
@product_blueprint.route("/add_product", methods=["POST"])
def add_product():
    try:
        data = request.json
        new_product = Product(
            name=data["name"],
            brand=data["brand"],
            description=data["description"],
            imageURL=data.get("imageURL"),
        )

        accord_objects = []
        for accord_data in data.get("accords", []):
            # Check if this is a dict with name and color or just a name string
            if isinstance(accord_data, dict):
                accord_name = accord_data["name"]
                background_color = accord_data.get("background_color")
            else:
                accord_name = accord_data
                background_color = None

            accord_obj = Accord.query.filter_by(name=accord_name).first()
            if not accord_obj:
                accord_obj = Accord(name=accord_name, background_color=background_color)
                db.session.add(accord_obj)
            elif background_color and not accord_obj.background_color:
                # Update background color if it's not set
                accord_obj.background_color = background_color

            accord_objects.append(accord_obj)

        new_product.accords = accord_objects
        db.session.add(new_product)
        db.session.commit()

        return (
            jsonify(
                {
                    "id": new_product.id,
                    "name": new_product.name,
                    "brand": new_product.brand,
                    "description": new_product.description,
                    "accords": [
                        {
                            "name": accord.name,
                            "background_color": accord.background_color,
                        }
                        for accord in new_product.accords
                    ],
                    "imageURL": new_product.imageURL,
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# NOTE: Add a review for a product
@product_blueprint.route("/add_review/<int:product_id>", methods=["POST"])
def add_review(product_id):
    try:
        data = request.json

        # Validate incoming data
        if "rating" not in data or "content" not in data:
            return jsonify({"error": "Both 'rating' and 'content' are required"}), 400

        # Check that rating is an integer
        if not isinstance(data["rating"], int):
            return jsonify({"error": "'rating' must be an integer"}), 400

        # Find the product ID
        product = Product.query.get_or_404(product_id)

        # Create a new review
        new_review = Review(
            rating=data["rating"], content=data["content"], product_id=product.id
        )

        # Add the review to the product's review relationship
        db.session.add(new_review)
        db.session.commit()

        return (
            jsonify(
                {
                    "review_id": new_review.id,
                    "product_id": new_review.product_id,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error adding review: {e}")  # Add detailed logging for debugging
        return jsonify({"error": str(e)}), 400


# NOTE: return reviews that belong a product
@product_blueprint.route("/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        reviews = product.reviews.all()

        return (
            jsonify(
                {
                    "product_id": product_id,
                    "reviews": [
                        {
                            "id": review.id,
                            "rating": review.rating,
                            "content": review.content,
                        }
                        for review in reviews
                    ],
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return jsonify({"error": str(e)}), 400


# ----------------------------- #
#           ACCORDS             #
# ----------------------------- #


@product_blueprint.route("/accords", methods=["GET"])
def list_accords():
    accords = Accord.query.all()

    return jsonify([{"id": accord.id, "name": accord.name} for accord in accords])


# NOTE: Recommendation Route
@product_blueprint.route("/recommendation-by-accord", methods=["POST"])
def recommend_products():
    try:
        MIN_MATCH_RATIO = 0.3
        MAX_RECOMMENDATIONS = 20

        data = request.json
        logger.info("Received Data: ", data)

        user_accords = data.get("accordbank", [])
        logger.info("User Accords: ", user_accords)

        if not user_accords:
            return jsonify({"error": "No accord bank data provided"}), 400

        # Normalize accord names to lowercase
        user_accords = set(accord.lower() for accord in user_accords)
        logger.info("Normalized user accords: ", user_accords)

        # Query All products with their accords
        all_products = Product.query.join(Product.accords).distinct().all()
        logger.info("Found producst:", len(all_products))

        # Calculate match ratios and filter products
        matched_products = []

        for product in all_products:
            product_accords = set(accord.name.lower() for accord in product.accords)

            if not product_accords:  # Skip products with no accords
                continue

            # Calculate intersection and match ratio
            matching_accords = user_accords.intersection(product_accords)
            match_ratio = len(matching_accords) / len(product_accords)

            if match_ratio >= MIN_MATCH_RATIO:
                matched_products.append(
                    {"product": product, "match_ratio": match_ratio}
                )

        if not matched_products:
            return jsonify({"message": "No recommendations found"}), 200

        # Randomly select products from matched ones
        if len(matched_products) > MAX_RECOMMENDATIONS:
            matched_products = random.sample(matched_products, MAX_RECOMMENDATIONS)
        else:
            random.shuffle(matched_products)

        base_url = "http://api-gateway:8000/images/"

        # Format the recommendations
        recommendations = [
            {
                "id": item["product"].id,
                "name": item["product"].name,
                "brand": item["product"].brand,
                "accords": [accord.name for accord in item["product"].accords],
                "imageURL": (
                    base_url + item["product"].imageURL
                    if item["product"].imageURL
                    else None
                ),
                "match_ratio": round(
                    item["match_ratio"] * 100, 2
                ),  # Convert to percentage with 2 decimal places
            }
            for item in matched_products
        ]

        return jsonify(
            {"recommendations": recommendations, "total_matches": len(matched_products)}
        )

    except Exception as e:
        import traceback

        print(f"Error in recommendations route: {e}")
        print(f"Full error details:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@product_blueprint.route("/recommendations/seasonal", methods=["GET"])
def recommend_by_season():
    try:
        # Determine current season based on today's date
        today = date.today()
        month = today.month

        # Map months to seasons
        if month in [12, 1, 2]:
            season = "winter"
        elif month in [3, 4, 5]:
            season = "spring"
        elif month in [6, 7, 8]:
            season = "summer"
        else:
            season = "fall"

        # Seasonal Accord Mapping
        seasonal_accords = {
            "winter": [
                "Amber",
                "Animalic",
                "Leather",
                "Musky",
                "Oud",
                "Patchouli",
                "Smoky",
                "Tobacco",
                "Vanilla",
                "Warm Spicy",
                "Balsamic",
                "Beeswax",
                "Bitter",
                "Cacao",
                "Caramel",
                "Chocolate",
                "Coffee",
                "Rum",
                "Whiskey",
                "Asphalt",
                "Brown Scotch Tape",
                "Gasoline",
                "Industrial Glue",
                "Meat",
                "Rubber",
                "Wet Plaster",
            ],
            "spring": [
                "Aldehydic",
                "Floral",
                "Fresh",
                "Green",
                "Herbal",
                "Powdery",
                "Rose",
                "Violet",
                "White Floral",
                "Yellow Floral",
                "Almond",
                "Iris",
                "Lavender",
                "Tuberose",
            ],
            "summer": [
                "Aquatic",
                "Citrus",
                "Fruity",
                "Marine",
                "Salty",
                "Tropical",
                "Ozonic",
                "Soapy",
                "Sweet",
                "Coconut",
                "Cherry",
                "Conifer",
                "Honey",
                "Sand",
                "Sour",
            ],
            "fall": [
                "Aromatic",
                "Earthy",
                "Mossy",
                "Soft Spicy",
                "Woody",
                "Camphor",
                "Cinnamon",
                "Nutty",
                "Spicy",
                "Mineral",
                "Vinyl",
                "Plastic",
                "Hot Iron",
                "Bacon",
                "Tennis Ball",
            ],
        }

        accords = seasonal_accords[season]

        # Query products matching seasonal accords and count matches
        recommended_products = (
            db.session.query(
                Product, func.count(func.lower(Accord.name)).label("match_count")
            )
            .join(Product.accords)
            .filter(func.lower(Accord.name).in_([accord.lower() for accord in accords]))
            .group_by(Product.id)
            .having(func.count(func.lower(Accord.name)) >= 3)
            .order_by(func.random())  # Order by match count
            .limit(10)  # Fetch more products initially to handle duplicates
            .all()
        )

        if not recommended_products:
            return (
                jsonify(
                    {"message": f"No recommendations found for the {season} season"}
                ),
                200,
            )

        # Generate unique recommendations
        recommendations = []
        added_names = set()  # Track already added product names
        base_url = "http://api-gateway:8000/images/"

        for product, match_count in recommended_products:
            if product.name.lower() not in added_names:
                recommendations.append(
                    {
                        "id": product.id,
                        "name": product.name,
                        "brand": product.brand,
                        "accords": [accord.name for accord in product.accords],
                        "imageURL": (
                            base_url + product.imageURL if product.imageURL else None
                        ),
                        "matching_accords_count": match_count,  # Include the match count
                    }
                )
                added_names.add(product.name.lower())

            # Stop adding products once we have 5 unique recommendations
            if len(recommendations) == 5:
                break

        return jsonify(
            {"season": season.capitalize(), "recommendations": recommendations}
        )

    except Exception as e:
        print(f"Error in seasonal recommendations route: {e}")
        return jsonify({"error": str(e)}), 500


# NOTE: Rating Routes
