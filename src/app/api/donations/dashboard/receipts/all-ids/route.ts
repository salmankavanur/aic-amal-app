// src/app/api/donations/dashboard/receipts/all-ids/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Donation from '@/models/Donation';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const selectedType = searchParams.get('type') || '';
    
    // Build query filters
    const query: any = { status: 'Completed' }; // Only completed donations are eligible for receipts
    
    // Handle search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle type filter
    if (selectedType) {
      query.type = selectedType;
    }
    
    // Handle date filters
    if (dateFrom || dateTo) {
      query.createdAt = {};
      
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        // Add one day to include the end date fully
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query.createdAt.$lte = endDate;
      }
    }
    
    // Only fetch IDs to reduce payload size and improve performance
    const donations = await Donation.find(query).select('_id').lean();
    
    // Extract just the IDs - using type assertion to handle TypeScript issue
    const donationIds = donations.map(donation => {
      // Use type assertion to tell TypeScript that _id has a toString method
      const id = donation._id as { toString(): string };
      return id.toString();
    });
    
    // Return all IDs
    return NextResponse.json({
      success: true,
      donationIds,
      totalItems: donationIds.length
    });
  } catch (error) {
    console.error('Error fetching donation IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation IDs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}