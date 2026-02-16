import { sendWorkflowExecution } from "@/inngest/utils";
import { timeStamp } from "console";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { success: false, message: "Missing workflowId query parameter" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const stripeData = {
      // Event metadata
      eventId: body.id,
      eventType: body.type,
      timestamp: body.created,
      livemode: body.livemode,
      raw: body.data?.object, // Full event data from Stripe
    };

    // Send to Inngest - this triggers the "workflows/execute.workflow" event
    await sendWorkflowExecution({
      workflowId,
      initialData: {
        stripe: stripeData,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in Stripe webhook:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process Stripe event" },
      { status: 500 },
    );
  }
}
