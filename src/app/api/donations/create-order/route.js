// src/app/api/donations/create-order/route.js


// src/app/api/donations/create-order/route.js
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { amount, campaignId } = await req.json();

    // Validate amount (required in all cases)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Optional campaignId validation (only if provided)
    if (campaignId && typeof campaignId !== 'string') {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const orderOptions = {
      amount, // Already in paise from frontend
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(orderOptions);
    
    // Return orderId and campaignId (if provided) in response
    return NextResponse.json(
      {
        orderId: order.id,
        ...(campaignId && { campaignId }), // Include campaignId only if sent
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}













// import Razorpay from "razorpay";
// import { NextResponse } from "next/server";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Define route mapping for the three accounts
// const routeMap = {
//   General: "acc_Q2hoHoP4Xi0HeL", // General account
//   Building: "acc_Q2hsRyRV7yDRP6", // Building account
//   Yatheem: "acc_Q2hxjkOPO3WMZB", // Yatheem account
// };

// export async function POST(req) {
//   try {
//     const { amount, route } = await req.json();

//     // Validate amount (required in all cases)
//     if (!amount || amount <= 0) {
//       return NextResponse.json({ error: "Invalid amount. Must be greater than 0" }, { status: 400 });
//     }

//     // Validate route
//     if (!route || !routeMap[route]) {
//       return NextResponse.json(
//         { error: "Invalid or missing route. Use 'General', 'Building', or 'Yatheem'" },
//         { status: 400 }
//       );
//     }

//     // Get the account ID based on the route
//     const accountId = routeMap[route];

//     // Create Razorpay order with transfer to the specified account
//     const orderOptions = {
//       amount, // Already in paise from frontend (e.g., 50000 for ₹500)
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//       transfers: [
//         {
//           account: accountId, // Route payment to the selected account
//           amount, // Full amount routed to this account
//           currency: "INR",
//           on_hold: false, // Immediate transfer; set to true for manual approval
//         },
//       ],
//     };

//     const order = await razorpay.orders.create(orderOptions);

//     // Return orderId in response
//     return NextResponse.json(
//       {
//         orderId: order.id,
//         route, // Optional: Include route in response for confirmation
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error creating Razorpay order:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to create order",
//         details: error.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }