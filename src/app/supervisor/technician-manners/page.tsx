'use client';

import React, { useState, useEffect } from 'react';
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TechnicianSelect from './components/TechnicianSelect';
import MannersTable from './components/MannersTable';
import MannersSummary from './components/MannersSummary';
import AddEvaluationForm from './components/AddEvaluationForm';
import SearchFilter, { SearchFilters } from './components/SearchFilter';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

// Fallback mock data in case API calls fail
const mockTechnicians = [
  { user_id: 1, first_name: 'John', last_name: 'Doe', staff_code: 'TECH001' },
  { user_id: 2, first_name: 'Jane', last_name: 'Smith', staff_code: 'TECH002' },
  { user_id: 3, first_name: 'Mike', last_name: 'Johnson', staff_code: 'TECH003' },
];

export default function TechnicianMannersPage() {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    startDate: '',
    endDate: '',
    invoiceNumber: '',
    workOrderId: ''
  });

  // Fetch all technicians with role_id = 2 (technicians)
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        // Try to get real technician data from API
        const response = await api.get('/users?role=2');
        if (response.data && response.data.length > 0) {
          setTechnicians(response.data);
        } else {
          // Fallback to mock data if API returns empty
          setTechnicians(mockTechnicians);
        }
      } catch (error) {
        console.error('Error fetching technicians:', error);
        // Fallback to mock data if API fails
        setTechnicians(mockTechnicians);
        toast({
          title: 'Warning',
          description: 'Using mock technician data. Backend API may be unavailable.',
          variant: 'destructive',
        });
      }
    };

    fetchTechnicians();
  }, [toast]);

  // Reset pagination when a technician is selected or filters change
  useEffect(() => {
    if (selectedTechnician) {
      setCurrentPage(1);
    }
  }, [selectedTechnician, searchFilters]);

  // Fetch evaluations and summary when a technician is selected, pagination changes, or filters change
  useEffect(() => {
    if (!selectedTechnician) return;

    const fetchEvaluations = async () => {
      setLoading(true);
      try {
        // Build query parameters for filtering
        let queryParams = `page=${currentPage}&limit=${pageSize}`;
        
        if (searchFilters.startDate) {
          queryParams += `&startDate=${searchFilters.startDate}`;
        }
        
        if (searchFilters.endDate) {
          queryParams += `&endDate=${searchFilters.endDate}`;
        }
        
        if (searchFilters.invoiceNumber) {
          queryParams += `&invoiceNumber=${searchFilters.invoiceNumber}`;
        }
        
        if (searchFilters.workOrderId) {
          queryParams += `&workOrderId=${searchFilters.workOrderId}`;
        }
        
        // Get real evaluation data from API with pagination and filters
        const [evaluationsResponse, summaryResponse] = await Promise.all([
          api.get(`/technician-manners/${selectedTechnician.user_id}?${queryParams}`),
          api.get(`/technician-manners/summary/${selectedTechnician.user_id}`)
        ]);
        
        // Check if the response includes paginated data
        if (evaluationsResponse.data.data && evaluationsResponse.data.pagination) {
          setEvaluations(evaluationsResponse.data.data || []);
          setPaginationInfo(evaluationsResponse.data.pagination);
        } else {
          // Handle old API format
          setEvaluations(evaluationsResponse.data || []);
          setPaginationInfo(null);
        }
        
        setSummary(summaryResponse.data || null);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        // Set empty data if API fails
        setEvaluations([]);
        setSummary(null);
        setPaginationInfo(null);
        toast({
          title: 'Error',
          description: 'Failed to load evaluation data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [selectedTechnician, currentPage, pageSize, searchFilters, toast]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  // Handle search form submission
  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleAddEvaluation = async (evaluation) => {
    if (!selectedTechnician) {
      toast({
        title: 'Error',
        description: 'Please select a technician first',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Send the evaluation data to the API
      await api.post('/technician-manners', {
        ...evaluation,
        technician_id: selectedTechnician.user_id
      });
      
      // Reset to first page and refetch evaluations
      setCurrentPage(1);
      
      // Build query parameters for filtering
      let queryParams = `page=1&limit=${pageSize}`;
      
      if (searchFilters.startDate) {
        queryParams += `&startDate=${searchFilters.startDate}`;
      }
      
      if (searchFilters.endDate) {
        queryParams += `&endDate=${searchFilters.endDate}`;
      }
      
      if (searchFilters.invoiceNumber) {
        queryParams += `&invoiceNumber=${searchFilters.invoiceNumber}`;
      }
      
      if (searchFilters.workOrderId) {
        queryParams += `&workOrderId=${searchFilters.workOrderId}`;
      }
      
      // Refetch evaluations and summary to update the UI
      const [evaluationsResponse, summaryResponse] = await Promise.all([
        api.get(`/technician-manners/${selectedTechnician.user_id}?${queryParams}`),
        api.get(`/technician-manners/summary/${selectedTechnician.user_id}`)
      ]);
      
      // Check if the response includes paginated data
      if (evaluationsResponse.data.data && evaluationsResponse.data.pagination) {
        setEvaluations(evaluationsResponse.data.data || []);
        setPaginationInfo(evaluationsResponse.data.pagination);
      } else {
        // Handle old API format
        setEvaluations(evaluationsResponse.data || []);
        setPaginationInfo(null);
      }
      
      setSummary(summaryResponse.data || null);
      
      toast({
        title: 'Success',
        description: 'Evaluation added successfully',
      });
    } catch (error) {
      console.error('Error adding evaluation:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add evaluation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Technician Manners Evaluation</h1>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Technician</CardTitle>
          </CardHeader>
          <CardContent>
            <TechnicianSelect 
              technicians={technicians} 
              selectedTechnician={selectedTechnician}
              onSelectTechnician={setSelectedTechnician}
            />
          </CardContent>
        </Card>
      </div>

      {selectedTechnician && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Add New Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <AddEvaluationForm onSubmit={handleAddEvaluation} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <MannersSummary summary={summary} loading={loading} />
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchFilter onSearch={handleSearch} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Evaluation History</CardTitle>
            </CardHeader>
            <CardContent>
              <MannersTable 
                evaluations={evaluations} 
                loading={loading} 
                pagination={paginationInfo}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </>
      )}
      
      <Toaster />
    </div>
  );
}