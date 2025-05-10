import overpy
from typing import Optional

def find_building_id_by_coords(longitude: float, latitude: float, house_number_arg: Optional[str] = None):
    """
    Searches for a building near given coordinates with a matching house number.
    Returns the building ID if found, otherwise None.
    """
    # Initialize Overpass API
    api = overpy.Overpass()
    radius = 50  # Searching radius in meters
    if house_number_arg is None:
         radius = 50

    # Create a query to find buildings around the given coordinates
    query = f"""
        [out:json];
        (
            node(around:{radius},{latitude},{longitude})["building"];
            way(around:{radius},{latitude},{longitude})["building"];
            relation(around:{radius},{latitude},{longitude})["building"];
        );
        out center;
    """
    
    # Execute the query
    result = api.query(query)

    # Check each building for a matching house number
    for way in result.ways:
        house_number = way.tags.get('addr:housenumber', '')

        # Compare only the house number if provided
        if house_number_arg is None:
            return way
        
        if house_number == house_number_arg:
            return way.id

    return None


def get_building_data_by_id(building_id: int, element_type: str = 'way'):
    """
    Retrieves all available data about a specified building by its OSM ID, returning it in a JSON format.
    
    Parameters:
    - building_id (int): The OSM ID of the building to retrieve.
    - element_type (str): The type of OSM element ('node', 'way', or 'relation').
    
    Returns:
    - dict: A JSON-compliant dictionary containing the building's data.
    """
    # Initialize Overpass API
    api = overpy.Overpass()

    # Validate the element_type
    if element_type not in ['node', 'way', 'relation']:
        raise ValueError("Element type must be one of 'node', 'way', or 'relation'.")

    # Formulate the query based on the element type
    query = f"""
        [out:json];
        {element_type}({building_id});
        out body;
        >;
        out skel qt;
    """

    # Execute the query
    try:
        result = api.query(query)
    except Exception as e:
        print(f"Error querying Overpass API: {e}")
        return None

    # Extract the relevant element data
    if element_type == 'node':
        elements = result.nodes
    elif element_type == 'way':
        elements = result.ways
    else:  # element_type == 'relation'
        elements = result.relations

    # Convert the element data to a JSON-compatible dictionary
    if elements:
        element_data = elements[0]  # Assumes one result per ID, extracts details
        data_dict = {
            "id": element_data.id,
            "tags": element_data.tags,
            "center": getattr(element_data, 'center', None),
            "nodes": [node.id for node in getattr(element_data, 'nodes', [])],
            "members": [member.ref for member in getattr(element_data, 'members', [])],
        }
        return data_dict
    else:
        print("No data found for the specified ID.")
        return None

# Example usage


# Example usage
if __name__ == "__main__":
    # Example coordinates for the search (latitude and longitude in decimal degrees)
    input_latitude = 38.89767  # Replace with the actual latitude
    input_longitude = -77.03655  # Replace with the actual longitude 
    input_house_number = "15"
    
    building_id = find_building_id_by_coords(input_longitude, input_latitude)
    print(building_id)
    element_type = 'way'     # Specify the type 'node', 'way', or 'relation'
    building_data = get_building_data_by_id(building_id, element_type)
    if building_data:
        print(json.dumps(building_data, indent=2))  # Pretty-print the JSON data