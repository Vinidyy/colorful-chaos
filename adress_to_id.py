from geopy.geocoders import Nominatim
import overpy

def find_building_id_by_address(street: str, house: str, postal: str, city: str, country: str = "Germany"):
    """
    Searches for the geolocation of an address and then searches for a house with matching house number and zip code.
    Returns the building id if found, otherwise None.
    """
    # Initialize Nominatim and Overpass API
    geolocator = Nominatim(user_agent="address_matcher")
    api = overpy.Overpass()

    # Construct full address for geocoding
    full_address = f"{house} {street}, {postal} {city}, {country}"
    
    # Geocode the input address
    location = geolocator.geocode(full_address)
    if not location:
        return None

    # Start with a small radius and incrementally search larger areas
    base_radius = 5  # Initial small radius in meters
    max_radius = 200  # Maximum radius to prevent excessive querying
    radius_increment = 20  # Increment amount for each step
    radius = base_radius
    
    while radius <= max_radius:
        # Create a query to find buildings around the geocoded location
        latitude = location.latitude
        longitude = location.longitude
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

        # Check each building for matching postal code and house number
        for way in result.ways:
            house_number = way.tags.get('addr:housenumber', '')
            postcode = way.tags.get('addr:postcode', '')
            # Compare only the postal code and house number
            if house_number == house and postcode == postal:
                return way.id

        # Increase the radius for the next iteration
        radius += radius_increment
    
    return None

# Example usage
if __name__ == "__main__":
    input_street = "Im Vogelsang"
    input_house = "15"
    input_postal = "72622"
    input_city = "Nuertingen"

    building_id = find_building_id_by_address(input_street, input_house, input_postal, input_city)
    print(building_id)