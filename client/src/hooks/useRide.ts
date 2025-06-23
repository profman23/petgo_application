import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Ride, Driver } from '@shared/schema';

export function useRide() {
  const queryClient = useQueryClient();

  const { data: activeRideData, isLoading: isLoadingActiveRide } = useQuery({
    queryKey: ['/api/rides/active'],
    refetchInterval: 2000, // Poll every 2 seconds for status updates
  });

  const requestRideMutation = useMutation({
    mutationFn: async (rideData: any) => {
      const response = await apiRequest('POST', '/api/rides/request', rideData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      // Note: Simulation disabled - doctors will manually approve/reject
    },
  });

  const simulateRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/simulate`);
      return response.json();
    },
  });

  const cancelRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('PUT', `/api/rides/${rideId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
    },
  });

  const { data: nearbyDrivers } = useQuery({
    queryKey: ['/api/drivers/nearby'],
    enabled: false, // Only fetch when needed
  });

  const fetchNearbyDrivers = async (latitude: number, longitude: number) => {
    const response = await apiRequest('GET', `/api/drivers/nearby?latitude=${latitude}&longitude=${longitude}`);
    return response.json();
  };

  return {
    activeRide: activeRideData?.ride,
    assignedDriver: activeRideData?.driver,
    isLoadingActiveRide,
    nearbyDrivers,
    requestRide: requestRideMutation.mutate,
    isRequestingRide: requestRideMutation.isPending,
    cancelRide: cancelRideMutation.mutate,
    isCancellingRide: cancelRideMutation.isPending,
    fetchNearbyDrivers,
  };
}
