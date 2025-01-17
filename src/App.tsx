import { useState, useEffect } from 'react'
import { AddressAutoComplete, type AddressType } from './components/AddressAutocomplete'
import { Moon, Sun } from 'lucide-react'

function App() {
  const [address, setAddress] = useState<AddressType>({
    address1: "",
    address2: "",
    formattedAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    lat: 0,
    lng: 0,
  });
  const [searchInput, setSearchInput] = useState("");

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="fixed top-4 right-4 p-2 rounded-full bg-background border border-input hover:bg-accent"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center text-foreground">Address Autocomplete</h1>
        <AddressAutoComplete
          address={address}
          setAddress={setAddress}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          showLocationIcon={true}
          showMapIcon={true}
          onLocationDetect={(coords) => {
            console.log('Detected location:', coords);
          }}
          // Optional custom classes
          locationIconClass="hover:text-blue-500"
          mapIconClass="text-gray-400"
        />
      </div>
    </div>
  )
}

export default App