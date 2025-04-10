import connectToDatabase from "@/lib/db";
import Box from "@/models/Box";
import Donation from "@/models/Donation";
import { getPaymentStatus } from "@/lib/paymentStatus";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let phone = searchParams.get("phone");

    const sessionUserPhone=phone;
    console.log("sdsdfffffdddddddddd",sessionUserPhone);
    

    if (!sessionUserPhone) {
      return new Response(JSON.stringify({ error: "Unauthorized, please log in" }), {
        status: 401,
      });
    }

    await connectToDatabase();
    const boxes = await Box.find({ "sessionUser.phone": sessionUserPhone })
      .select("serialNumber name mobileNumber lastPayment")
      .lean();

    if (!boxes.length) {
      return new Response(JSON.stringify({ message: "No boxes assigned to you" }), {
        status: 200,
      });
    }

    // Fetch all donation details for each box
    const boxesWithDetails = await Promise.all(
      boxes.map(async (box) => {
        const { status, period } = getPaymentStatus(box.lastPayment);

        // Fetch ALL donations for this box from the Donation collection
        const donations = await Donation.find({ boxId: box._id })
          .sort({ createdAt: -1 }) // Sort by latest first
          .select("amount razorpayPaymentId createdAt")
          .lean();

        return {
          ...box,
          paymentStatus: status,
          currentPeriod: period,
          donations: donations.map((donation) => ({
            amount: donation.amount,
            paymentId: donation.razorpayPaymentId,
            date: donation.createdAt,
          })), // Return all donations as an array
          latestPayment: donations.length
            ? {
                amount: donations[0].amount,
                paymentId: donations[0].razorpayPaymentId,
                date: donations[0].createdAt,
              }
            : null, // Keep latestPayment for backward compatibility
        };
      })
    );

    return new Response(JSON.stringify(boxesWithDetails), { status: 200 });
  } catch (error) {
    console.error("Error fetching boxes:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}