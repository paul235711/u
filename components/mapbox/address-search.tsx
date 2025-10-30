'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Suggestion {
  place_name: string;
  center: [number, number];
}

export function AddressSearch({ onSelect, initialValue = '' }: {
  onSelect: (result: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialValue?: string;
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (searchText: string) => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchText
        )}.json?access_token=${accessToken}&types=address,place,postcode,locality,neighborhood&limit=5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    const [lng, lat] = suggestion.center;
    setQuery(suggestion.place_name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect({
      address: suggestion.place_name,
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchAddresses(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for an address..."
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}