import jwt
import logging

from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from functools import wraps
from app.models.user import User
from app.models.scent import ScentBank, Accord, Product, Collection
from app.extensions import db

user_blueprint = Blueprint("user", __name__)


logger = logging.getLogger(__name__)

# TODO:
#
# ------------------------------------------------------------------------------------------#
# Token Required for JWT request
# Service to  service user need to go through JWT Checking point
#
# ------------------------------------------------------------------------------------------#

# NOTE:
# Database reset is neccessary if the token authentication are not accepted or invalid
# make sure writing the documentaion if there are unprecedented case. This service is
# reponsible for creating user account, return user's json information for client side


# NOTE: Home route
@user_blueprint.route("/")
def home():
    return jsonify("user-service launched!!")


# NOTE: Token Check point
def token_required(f):
    @wraps(f)
    def decorated(*arg, **kwargs):
        token = None

        if "Authorization" in request.headers:
            # Split Bearer <Token> into array
            token = request.headers["Authorization"].split(" ")[1]
        if not token:
            print("Token Missing")
            return jsonify({"error": "Token missing"}), 401

        try:
            print(f"Token   : {token}")
            print(f"SECRET_KEY  : {current_app.config['SECRET_KEY']}")

            data = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            print(f"Decoded: {data}")
            current_user = User.query.get(data["user_id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token is expried"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid Token"}), 401

        # Pass to the current_user to the wrapped function
        return f(current_user, *arg, **kwargs)

    return decorated


# @cross_origin(
#     origins="http://localhost:3000", headers=["Content-Type", "Authorization"]
# )


# NOTE: Add new user route
@user_blueprint.route("/register", methods=["POST", "OPTIONS"])
@cross_origin(origins="*", headers=["Content-Type", "Authorization"])
def register_user():
    if request.method == "OPTIONS":
        return _build_cors_prelight_response()

    try:
        firstName = request.json.get("firstName")
        lastName = request.json.get("lastName")
        email = request.json.get("email")
        password = request.json.get("password")
        userName = request.json.get("userName")
        dateOfBirth = request.json.get("dob")

        # checking if the user already
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already existed"}), 401

        # create a new user
        new_user = User(
            firstName=firstName,
            lastName=lastName,
            email=email,
            password=password,
            dateOfBirth=dateOfBirth,
            userName=userName,
        )
        db.session.add(new_user)  # add new user to database
        db.session.commit()  # commit the adding action

        # Create an empty ScentBank for this user
        new_scent_bank = ScentBank()
        db.session.add(new_scent_bank)
        db.session.commit()

        # assign the scentbank  id to the user's scentid
        new_user.scentID = new_scent_bank.id
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "User created successfully!",
                }
            ),
            202,
        )

    except Exception as e:
        # print(f"Error registering user: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 501


# NOTE: list all users
# WARNING: This route should be disabled
#
# ----------------------------------------------------------------#
@user_blueprint.route("/users", methods=["GET", "OPTIONS"])
@cross_origin(
    origins=["http://localhost:3000"],
    methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True,
)
@token_required
def list_users(current_user):  # Added current_user parameter
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "email": user.email,
                "dateOfBirth": user.dateOfBirth.strftime("%Y-%m-%d"),
                "scentID": user.scentID,
            }
            for user in users
        ]
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching users: {str(e)}"}), 501


# ----------------------------------------------------------------#

# NOTE: Update ScentBank


# WARNING: Don't uncomment this line
# @user_blueprint.route("/user/<int:user_id>/scentbank", methods=["PUT", "POST"])
@user_blueprint.route("/user/scentbank", methods=["PUT", "POST"])
@cross_origin(origin="http://localhost:3000", headers=["Content-Type", "Authorization"])
@token_required
def update_scentbank_for_user(current_user):
    try:
        # Get the user's existing ScentBank
        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "ScentBank not found for this user"}), 404

        # Collect the new data from the request (allow users to add their own custom data)
        favorite_accords = request.json.get("favorite_accords", [])
        favorite_products = request.json.get("favorite_products", [])
        favorite_collections = request.json.get("favorite_collections", [])

        accord_objects = scent_bank.favorite_accords if favorite_accords else None
        product_objects = scent_bank.favorite_products if favorite_products else None
        collection_objects = (
            scent_bank.favorite_collections if favorite_collections else None
        )

        # Add new Accord into ScentBank
        if favorite_accords:
            accord_objects = []
            for accord in favorite_accords:
                accord_obj = Accord.query.filter_by(name=accord).first()
                if not accord_obj:
                    accord_obj = Accord(name=accord)
                    db.session.add(accord_obj)
            accord_objects.append(accord_obj)

        # Add new Product into ScentBank
        if favorite_products:
            product_objects = []
            for product in favorite_products:
                product_obj = Product.query.filter_by(name=product).first()
                if not product_obj:
                    product_obj = Product(name=product)
                    db.session.add(product_obj)
            product_objects.append(product_obj)

        # Add new Collection into ScentBank
        if favorite_collections:
            collection_objects = []
            for collection in favorite_collections:
                collection_obj = Collection.query.filter_by(name=collection).first()
                if not collection_obj:
                    collection_obj = Collection(name=collection)
                    db.session.add(collection_obj)
            collection_objects.append(collection_obj)

        # Commit the new objects to the database
        db.session.commit()

        # Update the User's ScentBank with their custom data
        if accord_objects:
            scent_bank.favorite_accords = accord_objects
        if product_objects:
            scent_bank.favorite_products = product_objects
        if collection_objects:
            scent_bank.favorite_collections = collection_objects

        db.session.commit()

        return jsonify({"message": "ScentBank updated successfully"}), 201

    except Exception as e:
        print(f"Error Updating ScentBank: {e}")
        db.session.rollback()
        return jsonify({"error": f"Fail to update ScentBank: {str(e)}"}), 500


# NOTE: reset db route
@user_blueprint.route("/reset-db", methods=["POST"])
def reset_db():
    try:
        # Drop all tables
        db.drop_all()

        # Recreate the tables
        db.create_all()

        # Apply migrations
        from flask_migrate import upgrade

        upgrade()

        db.session.commit()
        return jsonify({"message": "Database reset successful"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reset database: {str(e)}"}), 500


# ------------------------------------------------------------------------------------------------#
# NOTE: Test PUT API
@user_blueprint.route("/test-put", methods=["PUT"])
# @token_required
def test_put(current_user):
    try:
        return (
            jsonify(
                {"message": "PUT is successfully tested", "user": current_user.email}
            ),
            200,
        )
    except Exception as e:
        print(f"Error : {e}")
        return jsonify({"error": f"Fail to test the PUT METHOD: {str(e)}"}), 500


# ------------------------------------------------------------------------------------------------#


# NOTE: Route to update favorite accords
@user_blueprint.route("/scentbank/accords", methods=["PUT"])
@cross_origin(origin="http://localhost:3000", headers=["Content-Type", "Authorization"])
@token_required
def update_favorite_accords(current_user):
    try:
        favorite_accords = request.json.get("favorite_accords", [])
        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "ScentBank not found for this user"}), 404

        accord_objects = []
        for accord in favorite_accords:
            accord_obj = Accord.query.filter_by(name=accord).first()
            if not accord_obj:
                accord_obj = Accord(name=accord)
                db.session.add(accord_obj)
            accord_objects.append(accord_obj)

        scent_bank.favorite_accords = accord_objects
        db.session.commit()
        return jsonify({"message": "Favorite accords updated successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update favorite accords: {str(e)}"}), 500


# NOTE: Route to update favorite products
@user_blueprint.route("/scentbank/products", methods=["PUT"])
@cross_origin(origin="http://localhost:3000", headers=["Content-Type", "Authorization"])
@token_required
def update_favorite_products(current_user):
    try:
        product_name = request.json.get("favorite_product_name")
        action = request.json.get("action")

        if not product_name or not action:
            return jsonify({"error": "Product name and action are required"}), 400

        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "ScentBank not found for this user"}), 404

        # Get or create the product
        product_obj = Product.query.filter_by(name=product_name).first()

        # When this is the first time user add a new product into favorite_products
        if not product_obj:
            product_obj = Product(name=product_name)
            db.session.add(product_obj)

        # NOTE: when user want to add new perfume into favorite_products
        if action == "add":
            if product_obj not in scent_bank.favorite_products:
                scent_bank.favorite_products.append(product_obj)
                message = f"Product {product_name} added to favorites"
            else:
                message = f"Produt {product_name} is already in favorites"

        # NOTE: when user want to remove the perfume from favorite_accords
        elif action == "remove":
            if product_obj in scent_bank.favorite_products:
                scent_bank.favorite_products.remove(product_obj)
                message = f"Product {product_name} removed from favorites"
            else:
                message = f"Product {product_name} was not in favorites"

        else:
            return jsonify({"error": "Invalid action. User 'add' or 'remove'"}), 400

        db.session.commit()

        # return updated list of favorite
        favorite_products = [product.name for product in scent_bank.favorite_products]
        return (
            jsonify({"message": message, "favorite_products": favorite_products}),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update favorite products: {str(e)}"}), 500


# NOTE: Route to update favorite collections
@user_blueprint.route("/scentbank/collections", methods=["PUT"])
@cross_origin(origin="http://localhost:3000", headers=["Content-Type", "Authorization"])
@token_required
def update_favorite_collections(current_user):
    try:
        favorite_collections = request.json.get("favorite_collections", [])
        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "ScentBank not found for this user"}), 404

        collection_objects = []
        for collection in favorite_collections:
            collection_obj = Collection.query.filter_by(name=collection).first()
            if not collection_obj:
                collection_obj = Collection(name=collection)
                db.session.add(collection_obj)
            collection_objects.append(collection_obj)

        scent_bank.favorite_collections = collection_objects
        db.session.commit()
        return jsonify({"message": "Favorite collections updated successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return (
            jsonify({"error": f"Failed to update favorite collections: {str(e)}"}),
            500,
        )


# WARNING: This route should be disabled for security reason.
# let me know if you need to open this route


# NOTE: Return all basic informations based on one user
@user_blueprint.route("/user", methods=["GET"])
@token_required
def get_user_details(current_user):
    try:
        user_details = {
            "firstName": current_user.firstName,
            "lastName": current_user.lastName,
            "email": current_user.email,
            "dateOfBirth": current_user.dateOfBirth.strftime("%Y-%m-%d"),
        }
        return jsonify(user_details), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching users: {str(e)}"}), 501


"""
This route will return user's information when a chat is initialized
"""


# NOTE: this route for sending user information to the forum-service
# for chat-service. Establishing connection for the frontend and backend
@user_blueprint.route("/user/chat-info", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@token_required
def get_user_chat_info(current_user):
    """
    Get minimal user information needed for chat features.
    """
    try:
        user_details = {
            "firstName": current_user.firstName,
            "lastName": current_user.lastName,
            "userName": current_user.userName,
            "userId": current_user.id,
        }

        return jsonify(user_details), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching users: {str(e)}"}), 501


# NOTE: this route is for the chat-service in the forum-service
@user_blueprint.route("/user/<int:user_id>/chat-info", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@token_required
def get_user_chat_info_by_id(current_user, user_id):
    """
    Get minimal user information needed for chat features by user ID.
    Requires authentication to prevent unauthorized access to user information.
    """
    try:
        # Optionally, you could add additional checks here
        # For example, verify if current_user has permission to view this info

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_details = {
            "firstName": user.firstName,
            "lastName": user.lastName,
            "userName": user.userName,
            "userId": user.id,
        }

        return jsonify(user_details), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching user: {str(e)}"}), 501


# NOTE: Return user information
@user_blueprint.route("/current-user/info", methods=["GET"])
@token_required
def get_user_info(current_user):
    try:
        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "user scent bank not found"}), 404
        user_info = {
            "id": current_user.id,
            "email": current_user.email,
            "firstName": current_user.firstName,
            "lastName": current_user.lastName,
            "userName": current_user.userName,
            "favorite_accords": [accord.name for accord in scent_bank.favorite_accords],
            "favorite_products": [
                product.name for product in scent_bank.favorite_products
            ],
            "favorite_collections": [
                collection.name for collection in scent_bank.favorite_collections
            ],
        }

        return jsonify(user_info), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching user info: {str(e)}"}), 500


# NOTE: Internal Routes for getting user info
# WARNING: This route is not used anywhere else. Considering deleting
@user_blueprint.route("/internal/user/<int:user_id>", methods=["GET"])
@cross_origin(
    origin="http://forum-service:5000", headers=["Content-Type", "Authorization"]
)
def get_internal_user_info(user_id):
    """
    internal endpoint for server-to-service communication.
    Only accessiable within the internal network.
    """
    user = User.query.get_or_404(user_id)
    return jsonify(
        {
            "userId": user.id,
            "userName": user.userName,
            "firstName": user.firstName,
            "lastName": user.lastName,
        }
    )


# NOTE: Getting the user preferences for favorite accords, product and Collection


@user_blueprint.route("/scentbank", methods=["GET"])
@cross_origin(
    origins="http://localhost:3000", headers=["Content-Type", "Authorization"]
)
@token_required
def get_user_preferences(current_user):
    try:
        scent_bank = ScentBank.query.get(current_user.scentID)
        if not scent_bank:
            return jsonify({"error": "user scentbank not found"}), 404

        scentBank = {
            "favorite_accords": [accord.name for accord in scent_bank.favorite_accords],
            "favorite_products": [
                product.name for product in scent_bank.favorite_products
            ],
            "favorite_collections": [
                collection.name for collection in scent_bank.favorite_collections
            ],
        }
        return jsonify(scentBank), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching Scent Bank: {str(e)}"}), 500


@user_blueprint.route("/scentbank/quiz-accords/<int:user_id>", methods=["POST"])
@cross_origin(origin="http://quiz-service:5000")
def update_accords_from_quiz(user_id):
    """
    Updates the favorite accords for a user's scent bank based on data from quiz-service.
    """
    try:
        favorite_accords = request.json.get("accords", [])
        if not favorite_accords:
            return jsonify({"error": "No accords provided"}), 400

        # Fetch the user's scent bank
        scent_bank = ScentBank.query.get(user_id)
        if not scent_bank:
            return jsonify({"error": "ScentBank not found for this user"}), 404

        # Retrieve or create Accord objects
        accord_objects = []
        for accord in favorite_accords:
            accord_obj = Accord.query.filter_by(name=accord).first()
            if not accord_obj:
                accord_obj = Accord(name=accord)
                db.session.add(accord_obj)
            accord_objects.append(accord_obj)

        # Update favorite accords in ScentBank
        scent_bank.favorite_accords = accord_objects
        db.session.commit()

        return jsonify({"message": "Favorite accords updated successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update favorite accords: {str(e)}"}), 500
