import { useEffect, useState } from "react";
import useSWR from "swr";
import { Loader2, MapPin, Locate } from "lucide-react";

// Types
export interface AddressType {
  address1: string;
  address2: string;
  formattedAddress: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
}

interface GooglePlaceResult extends google.maps.places.PlaceResult {
  address_components: google.maps.GeocoderAddressComponent[];
}

let googleMapsPromise: Promise<typeof google> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<typeof google> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function getAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
  format: 'long_name' | 'short_name'
): string {
  if (!components) return '';
  const component = components.find(c => c.types.includes(type));
  return component ? component[format] : '';
}

const emptyAddress: AddressType = {
  address1: "",
  address2: "",
  formattedAddress: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  lat: 0,
  lng: 0,
};

// Components
interface AddressAutoCompleteProps {
  address: AddressType;
  setAddress: (address: AddressType) => void;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  apiKey: string;
  showInlineError?: boolean;
  placeholder?: string;
  showLocationIcon?: boolean;
  showMapIcon?: boolean;
  onLocationDetect?: (coords: { lat: number; lng: number }) => void;
  locationIconClass?: string;
  mapIconClass?: string;
}

// Hooks
function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function AddressAutoComplete(props: AddressAutoCompleteProps) {
  const {
    address,
    setAddress,
    apiKey,
    showInlineError = true,
    searchInput,
    setSearchInput,
    placeholder,
    showLocationIcon = true,
    showMapIcon = true,
    locationIconClass,
    mapIconClass
  } = props;

  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    void loadGoogleMapsScript(apiKey);
  }, [apiKey]);

  const handleLocationDetect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });
          
          if (result.results[0]) {
            setSelectedPlaceId(result.results[0].place_id);
            props.onLocationDetect?.({ lat, lng });
          }
        } catch (error) {
          console.error('Geocoding failed:', error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      }
    );
  };

  const fetchPlaceDetails = async (placeId: string): Promise<GooglePlaceResult> => {
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));

    return new Promise<GooglePlaceResult>((resolve, reject) => {
      placesService.getDetails(
        { placeId, fields: ['address_components', 'formatted_address', 'geometry'] },
        (result, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
            reject(new Error('Failed to fetch place details'));
            return;
          }
          resolve(result as GooglePlaceResult);
        }
      );
    });
  };

  const { data } = useSWR(
    selectedPlaceId === "" ? null : selectedPlaceId,
    async (placeId) => {
      const result = await fetchPlaceDetails(placeId);
      const address = {
        address1: getAddressComponent(result.address_components, 'street_number', 'short_name') + ' ' +
                 getAddressComponent(result.address_components, 'route', 'short_name'),
        address2: '',
        formattedAddress: result.formatted_address || '',
        city: getAddressComponent(result.address_components, 'locality', 'long_name'),
        region: getAddressComponent(result.address_components, 'administrative_area_level_1', 'short_name'),
        postalCode: getAddressComponent(result.address_components, 'postal_code', 'short_name'),
        country: getAddressComponent(result.address_components, 'country', 'long_name'),
        lat: result.geometry?.location?.lat() || 0,
        lng: result.geometry?.location?.lng() || 0,
      };
      return { address };
    },
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data?.address) {
      setAddress(data.address as AddressType);
    }
  }, [data, setAddress]);

  return (
    <>
      {address.formattedAddress ? (
        <div className="relative">
          {showMapIcon && (
            <MapPin 
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground ${mapIconClass || ''}`}
            />
          )}
          <input
            value={searchInput || address?.formattedAddress}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) {
                setSelectedPlaceId("");
                setAddress(emptyAddress);
              }
            }}
            onFocus={() => {
              if (!searchInput) {
                setSearchInput(address.formattedAddress);
              }
              setIsOpen(true);
            }}
            className={`flex h-10 w-full rounded-md border border-input bg-background text-foreground py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${showMapIcon ? 'pl-10 pr-10' : 'px-3'}`}
          />
          <button
            onClick={() => {
              setSelectedPlaceId("");
              setAddress(emptyAddress);
              setSearchInput("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground hover:text-foreground"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <AddressAutoCompleteInput
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          selectedPlaceId={selectedPlaceId}
          setSelectedPlaceId={setSelectedPlaceId}
          showInlineError={showInlineError}
          placeholder={placeholder}
          showLocationIcon={showLocationIcon}
          showMapIcon={showMapIcon}
          handleLocationDetect={handleLocationDetect}
          isLocating={isLocating}
          locationIconClass={locationIconClass}
          mapIconClass={mapIconClass}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      )}
    </>
  );
}

interface CommonProps {
  selectedPlaceId: string;
  setSelectedPlaceId: (placeId: string) => void;
  showInlineError?: boolean;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  placeholder?: string;
  showLocationIcon?: boolean;
  showMapIcon?: boolean;
  handleLocationDetect: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLocating: boolean;
  locationIconClass?: string;
  mapIconClass?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function AddressAutoCompleteInput(props: CommonProps) {
  const {
    setSelectedPlaceId,
    selectedPlaceId,
    showInlineError = true,
    searchInput,
    setSearchInput,
    placeholder = "Enter address",
    showLocationIcon,
    showMapIcon,
    handleLocationDetect,
    isLocating,
    locationIconClass,
    mapIconClass,
    isOpen,
    setIsOpen
  } = props;

  const debouncedSearchInput = useDebounce(searchInput, 500);

  const { data, isLoading: isSuggestionsLoading } = useSWR(
    debouncedSearchInput ? debouncedSearchInput : null,
    async (input) => {
      const service = new google.maps.places.AutocompleteService();
      const predictions = await service.getPlacePredictions({ input });
      return {
        suggestions: predictions.predictions.map(prediction => ({
          placePrediction: {
            placeId: prediction.place_id,
            place: prediction.place_id,
            text: { text: prediction.description }
          }
        }))
      };
    },
    {
      revalidateOnFocus: false,
    }
  );

  const predictions = data?.suggestions || [];

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-between rounded-lg border bg-background ring-offset-background text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {showMapIcon && (
          <MapPin 
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground ${mapIconClass || ''}`}
          />
        )}
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={e => e.key === "Escape" && setIsOpen(false)}
          placeholder={placeholder}
          className={`w-full p-3 pr-10 rounded-lg outline-none bg-transparent text-foreground placeholder:text-muted-foreground ${showMapIcon ? 'pl-10' : 'pl-3'}`}
        />
        {showLocationIcon && (
          <button
            onClick={handleLocationDetect}
            disabled={isLocating}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm ${locationIconClass || ''}`}
            type="button"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Locate className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </div>
      {searchInput !== "" && !isOpen && !selectedPlaceId && showInlineError && (
        <div className="flex flex-col text-sm text-red-500 pt-1">
          <div className="flex gap-2">
            <p>Select a valid address from the list</p>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 w-full z-50 mt-1">
          <div className="relative h-auto min-w-[8rem] overflow-hidden rounded-md border shadow-md bg-background">
            {isSuggestionsLoading ? (
              <div className="h-28 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {predictions.map(
                  (prediction: {
                    placePrediction: {
                      placeId: string;
                      place: string;
                      text: { text: string };
                    };
                  }) => (
                    <div
                      key={prediction.placePrediction.placeId}
                      onClick={() => {
                        setSearchInput(prediction.placePrediction.text.text);
                        setSelectedPlaceId(prediction.placePrediction.place);
                        setIsOpen(false);
                      }}
                      className="flex select-text flex-col cursor-pointer gap-0.5 h-max p-2 px-3 hover:bg-accent hover:text-accent-foreground items-start"
                    >
                      {prediction.placePrediction.text.text}
                    </div>
                  )
                )}

                {predictions.length === 0 && (
                  <div className="py-4 flex items-center justify-center">
                    {searchInput === ""
                      ? "Please enter an address"
                      : "No address found"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}