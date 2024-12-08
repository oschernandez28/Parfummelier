import re
import requests
import json


def parse_perfume_data(file_path):
    with open(file_path, "r") as file:
        content = file.read()

    perfumes = content.split("\n\n---\n\n")
    parsed_data = []

    for perfume in perfumes:
        if not perfume.strip():
            continue

        perfume_data = {}

        # Extract name
        name_match = re.search(r"Perfume Name: (.*?)\n", perfume)
        if name_match and name_match.group(1) != "Unknown Perfume Name":
            perfume_data["name"] = name_match.group(1)
        else:
            continue

        # Extract brand (previously manufacturer)
        brand_match = re.search(r"Brand: (.*?)\n", perfume)
        if brand_match and brand_match.group(1) != "Unknown":
            perfume_data["brand"] = brand_match.group(1)
        else:
            continue

        # Extract image URL and get just the filename
        image_match = re.search(r"Image URL: .*?/(\d+x\d+\.\d+\.jpg)", perfume)
        if image_match:
            image_filename = image_match.group(1)
            perfume_data["imageURL"] = image_filename

        # Extract description
        description_match = re.search(r"Description: (.*?)\n", perfume)
        if description_match:
            perfume_data["description"] = description_match.group(1)
        else:
            perfume_data["description"] = "No description available"

        # Extract accords with colors
        accords_with_colors = []
        accord_matches = re.finditer(
            r"Accord: (.*?), Background Color: (#[A-Fa-f0-9]{6})", perfume
        )
        for match in accord_matches:
            accord_info = {"name": match.group(1), "background_color": match.group(2)}
            accords_with_colors.append(accord_info)
        perfume_data["accords"] = accords_with_colors

        if perfume_data.get("name") and perfume_data.get("brand"):
            parsed_data.append(perfume_data)

    return parsed_data


def check_existing_fragrances():
    """
    Fetch existing fragrances from the database to avoid duplicates.
    Returns a set of fragrance names already in the database.
    """
    api_endpoint = "http://localhost:8000/products"
    try:
        response = requests.get(
            api_endpoint, headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            existing_data = response.json()
            return {item["name"] for item in existing_data}
        else:
            print(
                f"Failed to fetch existing products: {response.status_code} {response.text}"
            )
            return set()
    except Exception as e:
        print(f"Error fetching existing products: {str(e)}")
        return set()


def populate_database(data):
    api_endpoint = "http://localhost:8000/products/add_product"

    existing_fragrances = check_existing_fragrances()
    print(f"Found {len(existing_fragrances)} existing fragrances in the database.")

    for perfume in data:
        if perfume["name"] in existing_fragrances:
            print(f"Skipping duplicate fragrance: {perfume['name']}")
            continue

        try:
            print(f"Sending data: {json.dumps(perfume, indent=2)}")  # Debug print
            response = requests.post(
                api_endpoint, json=perfume, headers={"Content-Type": "application/json"}
            )

            if response.status_code == 201:
                print(f"Successfully added: {perfume['name']}")
            else:
                print(f"Failed to add {perfume['name']}: {response.text}")

        except Exception as e:
            print(f"Error adding {perfume['name']}: {str(e)}")


if __name__ == "__main__":
    # NOTE: Update the path to point to the new file
    file_path = "result.txt"
    perfume_data = parse_perfume_data(file_path)
    print(f"Found {len(perfume_data)} perfumes to add")
    populate_database(perfume_data)