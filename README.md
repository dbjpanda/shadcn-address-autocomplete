# Shadcn Address Autocomplete Component

A reusable React address autocomplete component built with shadcn/ui components and Google Places API.

## Features

- 🌍 Google Places API integration
- 🎨 Tailwind CSS styling
- 🌓 Dark mode support
- 📱 Responsive design
- 🎯 Current location detection
- ⌨️ Keyboard navigation

## Quick Start

1. Copy these files to your project:

```
src/
  components/
    AddressAutocomplete.tsx  # Main component
```

2. Install required dependencies:

```bash
npm install @types/google.maps lucide-react swr
```

3. Make sure you have Tailwind CSS set up in your project. If not, install it:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. Use the component:

```tsx
import { AddressAutoComplete } from './components/AddressAutocomplete';
import { useState } from 'react';

// Define the address type
interface AddressType {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AddressAutoComplete
          address={address}
          setAddress={setAddress}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          apiKey="YOUR_GOOGLE_MAPS_API_KEY"
          showLocationIcon={true}
          showMapIcon={true}
          onLocationDetect={(coords) => {
            console.log('Detected location:', coords);
          }}
        />
      </div>
    </div>
  );
}

export default App;
```

## Prerequisites

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Places API and Geocoding API for your project

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| address | AddressType | Current address object | Required |
| setAddress | (address: AddressType) => void | Function to update address | Required |
| searchInput | string | Current search input value | Required |
| setSearchInput | (input: string) => void | Function to update search input | Required |
| apiKey | string | Google Maps API key | Required |
| showInlineError | boolean | Show validation errors | true |
| placeholder | string | Input placeholder | "Enter address" |
| showLocationIcon | boolean | Show location icon | true |
| showMapIcon | boolean | Show map icon | true |
| onLocationDetect | (coords: { lat: number; lng: number }) => void | Location detection callback | undefined |
| locationIconClass | string | Location icon CSS class | undefined |
| mapIconClass | string | Map icon CSS class | undefined |

## Dark Mode

The component supports dark mode out of the box. To enable it:

```tsx
// Add this to your root layout or component
const [theme, setTheme] = useState<'light' | 'dark'>('light');

useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);

// Add a toggle button
<button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
  Toggle Theme
</button>
```

## Styling

The component uses Tailwind CSS classes. You can customize the appearance by:

1. Using the provided class props (`locationIconClass`, `mapIconClass`)
2. Overriding the Tailwind classes in your CSS
3. Modifying the component's source code directly
