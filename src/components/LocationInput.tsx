import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Search, Navigation, Sparkles, X, Globe } from 'lucide-react';

export interface LocationDetails {
  city: string;
  state?: string;
  country?: string;
  lat?: number;
  lon?: number;
  formattedName: string;
}

interface LocationInputProps {
  value: string;
  onChange: (city: string, details?: LocationDetails) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
}

// Curated high-precision offline database of prominent birth places in India & globally
const POPULAR_CITIES: LocationDetails[] = [
  { city: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, formattedName: 'New Delhi, Delhi, India' },
  { city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lon: 82.9739, formattedName: 'Varanasi, Uttar Pradesh, India' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, formattedName: 'Mumbai, Maharashtra, India' },
  { city: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', lat: 26.7922, lon: 82.1998, formattedName: 'Ayodhya, Uttar Pradesh, India' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873, formattedName: 'Jaipur, Rajasthan, India' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, formattedName: 'Bengaluru, Karnataka, India' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639, formattedName: 'Kolkata, West Bengal, India' },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707, formattedName: 'Chennai, Tamil Nadu, India' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867, formattedName: 'Hyderabad, Telangana, India' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462, formattedName: 'Lucknow, Uttar Pradesh, India' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714, formattedName: 'Ahmedabad, Gujarat, India' },
  { city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567, formattedName: 'Pune, Maharashtra, India' },
  { city: 'Chandigarh', state: 'Chandigarh', country: 'India', lat: 30.7333, lon: 76.7794, formattedName: 'Chandigarh, India' },
  { city: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lon: 85.1376, formattedName: 'Patna, Bihar, India' },
  { city: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lon: 75.8577, formattedName: 'Indore, Madhya Pradesh, India' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2599, lon: 77.4126, formattedName: 'Bhopal, Madhya Pradesh, India' },
  { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', lat: 26.4499, lon: 80.3319, formattedName: 'Kanpur, Uttar Pradesh, India' },
  { city: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1767, lon: 78.0081, formattedName: 'Agra, Uttar Pradesh, India' },
  { city: 'Mathura', state: 'Uttar Pradesh', country: 'India', lat: 27.4924, lon: 77.6737, formattedName: 'Mathura, Uttar Pradesh, India' },
  { city: 'Ujjain', state: 'Madhya Pradesh', country: 'India', lat: 23.1765, lon: 75.7885, formattedName: 'Ujjain, Madhya Pradesh, India' },
  { city: 'Haridwar', state: 'Uttarakhand', country: 'India', lat: 29.9457, lon: 78.1642, formattedName: 'Haridwar, Uttarakhand, India' },
  { city: 'Rishikesh', state: 'Uttarakhand', country: 'India', lat: 30.0869, lon: 78.2676, formattedName: 'Rishikesh, Uttarakhand, India' },
  { city: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: 30.3165, lon: 78.0322, formattedName: 'Dehradun, Uttarakhand, India' },
  { city: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lon: 72.8311, formattedName: 'Surat, Gujarat, India' },
  { city: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882, formattedName: 'Nagpur, Maharashtra, India' },
  { city: 'Kathmandu', state: 'Bagmati', country: 'Nepal', lat: 27.7172, lon: 85.3240, formattedName: 'Kathmandu, Nepal' },
  { city: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, formattedName: 'London, United Kingdom' },
  { city: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, formattedName: 'New York, NY, USA' },
  { city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, formattedName: 'Dubai, UAE' },
  { city: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lon: -79.3832, formattedName: 'Toronto, Ontario, Canada' }
];

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = 'Type city name (e.g. Delhi, Mumbai, Varanasi)...',
  className = '',
  label,
  id = 'location-input'
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationDetails[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<LocationDetails | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync prop value
  useEffect(() => {
    setSearchTerm(value);
    // Check if initial value matches popular cities
    const matched = POPULAR_CITIES.find(
      c => c.formattedName.toLowerCase() === value.toLowerCase() || c.city.toLowerCase() === value.toLowerCase()
    );
    if (matched) {
      setSelectedDetails(matched);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    onChange(query);
    setSelectedDetails(null);
    setIsOpen(true);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // 1. Instant match against offline POPULAR_CITIES
    const localMatches = POPULAR_CITIES.filter(
      item =>
        item.city.toLowerCase().includes(query.toLowerCase()) ||
        item.formattedName.toLowerCase().includes(query.toLowerCase()) ||
        (item.state && item.state.toLowerCase().includes(query.toLowerCase()))
    );

    setSuggestions(localMatches);

    // 2. Debounced online geocoding lookup via OpenStreetMap Nominatim for exact match & small cities
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.length >= 2) {
      setIsSearchingOnline(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const onlineResults: LocationDetails[] = data.map((item: any) => {
              const addr = item.address || {};
              const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || item.name;
              const stateName = addr.state || addr.region || '';
              const countryName = addr.country || '';

              const formatted = [cityName, stateName, countryName].filter(Boolean).join(', ');
              return {
                city: cityName,
                state: stateName,
                country: countryName,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                formattedName: formatted || item.display_name
              };
            });

            // Combine local and online without duplicates
            const combined = [...localMatches];
            onlineResults.forEach(online => {
              if (!combined.some(c => c.formattedName.toLowerCase() === online.formattedName.toLowerCase())) {
                combined.push(online);
              }
            });

            setSuggestions(combined);
          }
        } catch (err) {
          console.warn('Map geocoding fallback error:', err);
        } finally {
          setIsSearchingOnline(false);
        }
      }, 350);
    }
  };

  const handleSelectLocation = (loc: LocationDetails) => {
    setSearchTerm(loc.formattedName);
    setSelectedDetails(loc);
    onChange(loc.formattedName, loc);
    setIsOpen(false);
  };

  // Detect GPS Location
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || 'Detected Location';
            const state = addr.state || '';
            const country = addr.country || '';
            const formatted = [city, state, country].filter(Boolean).join(', ');

            const details: LocationDetails = {
              city,
              state,
              country,
              lat: latitude,
              lon: longitude,
              formattedName: formatted
            };

            setSearchTerm(formatted);
            setSelectedDetails(details);
            onChange(formatted, details);
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsDetectingLocation(false);
        alert('Could not get current location. Please type your city name manually.');
      },
      { timeout: 8000 }
    );
  };

  const isVerified = Boolean(selectedDetails || POPULAR_CITIES.some(c => c.formattedName.toLowerCase() === searchTerm.toLowerCase() || c.city.toLowerCase() === searchTerm.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full space-y-1">
      {label && (
        <label htmlFor={id} className="text-xs text-gray-300 font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{label}</span>
          </span>
          {isVerified ? (
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Verified Map Location</span>
            </span>
          ) : searchTerm ? (
            <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
              <Search className="w-3 h-3 text-amber-300" />
              <span>Select from suggestions below</span>
            </span>
          ) : null}
        </label>
      )}

      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-amber-400/80 pointer-events-none" />

        <input
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-24 py-2 bg-black/50 border rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
            isVerified
              ? 'border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : searchTerm
              ? 'border-amber-500/40'
              : 'border-white/10'
          } ${className}`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDetails(null);
                onChange('');
                setSuggestions([]);
              }}
              className="p-1 text-gray-400 hover:text-white rounded-full transition-all cursor-pointer"
              title="Clear Location"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-[10px] font-semibold text-amber-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Auto-detect current location via GPS"
          >
            <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin text-amber-300' : ''}`} />
            <span className="hidden sm:inline">{isDetectingLocation ? 'Locating...' : 'GPS'}</span>
          </button>
        </div>
      </div>

      {/* Verified Coordinates Sub-bar */}
      {selectedDetails && (
        <div className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
          <span className="flex items-center gap-1 truncate">
            <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{selectedDetails.formattedName}</span>
          </span>
          {selectedDetails.lat && selectedDetails.lon && (
            <span className="shrink-0 text-emerald-400/80">
              {selectedDetails.lat.toFixed(2)}°, {selectedDetails.lon.toFixed(2)}°
            </span>
          )}
        </div>
      )}

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0e0824] border border-amber-500/30 rounded-2xl shadow-2xl max-h-56 overflow-y-auto scrollbar-thin divide-y divide-white/5 backdrop-blur-xl">
          {/* Quick Popular Chips */}
          {!searchTerm && (
            <div className="p-2.5 bg-black/40">
              <div className="text-[10px] font-bold text-amber-300/80 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Popular Vedic & Birth Locations</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.slice(0, 8).map((city, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(city)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-[10px] text-gray-200 hover:text-amber-200 transition-all cursor-pointer"
                  >
                    📍 {city.city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Online Loading Status */}
          {isSearchingOnline && (
            <div className="p-2 text-center text-[10px] text-amber-300 flex items-center justify-center gap-2">
              <Search className="w-3 h-3 animate-spin text-amber-400" />
              <span>Verifying location on global map...</span>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            suggestions.map((loc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectLocation(loc)}
                className="w-full px-3 py-2 text-left hover:bg-indigo-600/20 text-xs text-gray-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-all shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-white group-hover:text-amber-300 block leading-tight">
                      {loc.city}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {[loc.state, loc.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
                {loc.lat && (
                  <span className="text-[9px] font-mono text-gray-400 group-hover:text-amber-300 shrink-0 ml-2">
                    ✓ Verified
                  </span>
                )}
              </button>
            ))
          ) : searchTerm && !isSearchingOnline ? (
            <div className="p-3 text-center text-xs text-gray-400">
              <AlertCircle className="w-4 h-4 text-amber-400 mx-auto mb-1 opacity-80" />
              <span>No exact map match found for "{searchTerm}".</span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Press enter to use custom input or search another city name.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
