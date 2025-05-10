import overpy
import json
from typing import Optional, Dict, Any

class Building:
    def __init__(self, longitude: float, latitude: float, house_number: Optional[str] = None):
        self.longitude = longitude
        self.latitude = latitude
        self.house_number = house_number
        self.building_id: Optional[int] = None
        self.tags: Dict[str, Any] = {}
        self.center: Optional[Dict[str, float]] = None
        self.nodes: Optional[list] = []
        self.api = overpy.Overpass()

    def find_building_id(self):
        """
        Searches for a building near the given coordinates with a matching house number.
        Updates the building ID if found.
        """
        radius = 50  # Searching radius in meters

        # Create a query to find buildings around the given coordinates
        query = f"""
            [out:json];
            way(around:{radius},{self.latitude},{self.longitude})["building"];
            out body;
        """

        # Execute the query
        try:
            result = self.api.query(query)
        except Exception as e:
            print(f"Error querying Overpass API: {e}")
            return

        # Check each building for a matching house number
        for way in result.ways:
            house_number_osm = way.tags.get('addr:housenumber', '')
            # Compare only the house number if provided
            if self.house_number is None or house_number_osm == self.house_number:
                self.building_id = way.id
                break

    def fetch_building_data(self):
        """
        Retrieves all available data about the building by its OSM ID, storing it in the class attributes.
        """
        if not self.building_id:
            print("Building ID not found. Please find it first using find_building_id.")
            return

        # Formulate the query based on the building_id
        query = f"""
            [out:json];
            (
                way({self.building_id});
                >;
            );
            out body;
        """

        # Execute the query
        try:
            result = self.api.query(query)
        except Exception as e:
            print(f"Error querying Overpass API: {e}")
            return

        way = result.ways[0] if result.ways else None
        if way:
            self.tags = way.tags
            self.center = {"lat": way.center_lat, "lon": way.center_lon} if hasattr(way, 'center_lat') and way.center_lat else None
            self.nodes = [node.id for node in way.nodes]

    def to_json(self) -> str:
        """
        Returns a JSON representation of the building data.
        """
        return json.dumps({
            "building_id": self.building_id,
            "tags": self.tags,
            "center": self.center,
            "nodes": self.nodes
        }, indent=2)

# Example usage
if __name__ == "__main__":
    # Example coordinates for the search (latitude and longitude in decimal degrees)
    input_latitude = 38.89767  # Replace with the actual latitude
    input_longitude = -77.03655  # Replace with the actual longitude
    input_house_number = "15"

    # Initialize the Building class
    building = Building(longitude=input_longitude, latitude=input_latitude)

    # Find the building ID
    building.find_building_id()
    print(f"Building ID: {building.building_id}")

    # Fetch additional building data
    building.fetch_building_data()

    # Print building data as JSON
    print(building.to_json())
