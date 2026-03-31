-- Improve saved_flights performance and add better constraints

-- Add index for faster user-specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_flights_user_departure_time 
ON saved_flights(user_id, departure_time DESC);

-- Add index for flight number searches (useful for duplicate checking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_flights_flight_number 
ON saved_flights(lower(btrim(flight_number)));

-- Add index for departure airport filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_flights_departure_airport 
ON saved_flights(departure_airport);

-- Add index for arrival airport filtering  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_flights_arrival_airport 
ON saved_flights(arrival_airport);

-- Add partial index for family-shared flights
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_flights_family_shared 
ON saved_flights(user_id, departure_time DESC) 
WHERE family_shared = true;

-- Add a check constraint to ensure departure_time is not too far in the past (allow up to 1 year old flights)
ALTER TABLE saved_flights 
ADD CONSTRAINT saved_flights_departure_time_check 
CHECK (departure_time >= NOW() - INTERVAL '365 days');

-- Add a check constraint to ensure flight numbers follow basic format
ALTER TABLE saved_flights 
ADD CONSTRAINT saved_flights_flight_number_format 
CHECK (length(btrim(flight_number)) >= 2 AND length(btrim(flight_number)) <= 10);
