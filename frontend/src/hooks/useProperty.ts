import { usePropertyStore } from '../store/propertyStore';
import { propertiesApi } from '../api/properties';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useProperty() {
  const { activeProperty, properties, setActiveProperty, setProperties } = usePropertyStore();

  const { data: fetchedProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (fetchedProperties) {
      setProperties(fetchedProperties);
      if (!activeProperty && fetchedProperties.length > 0) {
        setActiveProperty(fetchedProperties[0]);
      }
    }
  }, [fetchedProperties, activeProperty, setProperties, setActiveProperty]);

  return {
    activeProperty,
    properties: properties.length > 0 ? properties : (fetchedProperties ?? []),
    setActiveProperty,
  };
}
