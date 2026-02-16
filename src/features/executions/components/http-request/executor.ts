/**
 * HTTP REQUEST NODE EXECUTOR
 *
 * Makes HTTP API calls and stores the response in workflow context.
 * Uses ky (tiny fetch wrapper) for the HTTP request.
 *
 * Node Config (data):
 * - variableName: Context key to store response (e.g., "apiData")
 * - endpoint: URL to call (supports Handlebars: {{variable}})
 * - method: HTTP method (GET, POST, PUT, DELETE, PATCH)
 * - body: Request body for POST/PUT/PATCH (supports Handlebars)
 *
 * Example:
 * - endpoint: "https://api.example.com/users/{{userId}}"
 * - method: "GET"
 * - variableName: "userData"
 * - Result: context.userData = { httpResponse: { status: 200, data: {...} } }
 */

import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { compileTemplate } from "@/features/executions/lib/template-utils";

// Type definition for this node's configuration
type HttpRequestData = {
  variableName?: string; // Key to store result in context
  endpoint?: string; // URL (can include {{variables}})
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string; // Request body (can include {{variables}})
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Publish "loading" status to frontend via realtime channel
  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    // Wrap in step.run() for durable execution
    const result = await step.run("http-request", async () => {
      // ========== VALIDATION ==========
      if (!data.endpoint) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError(
          "HTTP Request node: No endpoint configured",
        );
      }

      if (!data.variableName) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError(
          "HTTP Request node: No variable name configured",
        );
      }

      if (!data.method) {
        await publish(
          httpRequestChannel().status({
            nodeId,
            status: "error",
          }),
        );
        throw new NonRetriableError(
          "HTTP Request node: No HTTP method configured",
        );
      }

      // ========== TEMPLATE PROCESSING ==========
      // Compile Handlebars templates with current context
      // e.g., "https://api.example.com/users/{{userId}}" → "https://api.example.com/users/123"
      // Supports bracket notation: {{obj['key with spaces']}}
      const endpoint = compileTemplate(data.endpoint, context);
      const method = data.method;

      // Build ky request options
      const options: KyOptions = { method };

      // For POST/PUT/PATCH, process request body template
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const resolved = compileTemplate(data.body || "{}", context);
        JSON.parse(resolved); // Validate JSON syntax
        options.body = resolved;
        options.headers = {
          "Content-Type": "application/json",
        };
      }

      // ========== MAKE HTTP REQUEST ==========
      const response = await ky(endpoint, options);

      // Parse response based on content type
      const contentType = response.headers.get("content-type");
      const responseData = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      // Build response payload
      const responsePayload = {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      };

      // Return updated context with HTTP response
      // Other nodes can use {{variableName.httpResponse.data}} to access
      return {
        ...context,
        [data.variableName!]: responsePayload,
      };
    });

    // Publish success status
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "success",
      }),
    );
    return result;
  } catch (error) {
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
