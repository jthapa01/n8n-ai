# Technical Documentation

This document provides an in-depth overview of the n8n-ai workflow automation platform architecture.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React, Tailwind CSS, shadcn/ui, React Flow |
| Database | PostgreSQL (Neon), Prisma ORM |
| Authentication | Better Auth |
| API | tRPC (type-safe RPC) |
| Background Jobs | Inngest (durable workflows) |
| Realtime | Inngest Realtime (WebSocket) |
| AI SDKs | Vercel AI SDK (@ai-sdk/*) |
| Payments | Polar.sh |
| Error Tracking | Sentry |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── (editor)/      # Workflow editor
│   │   └── (rest)/        # Other dashboard pages
│   └── api/               # API routes
│       ├── auth/          # Better Auth endpoints
│       ├── inngest/       # Inngest webhook handler
│       ├── trpc/          # tRPC handler
│       └── webhooks/      # External webhook receivers
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui primitives
│   └── react-flow/       # React Flow node components
├── config/               # App configuration
│   └── node-components.ts # Node type → Component registry
├── features/             # Feature modules
│   ├── auth/             # Authentication logic
│   ├── credentials/      # API credentials management
│   ├── editor/           # Workflow editor
│   ├── executions/       # Workflow runs & node executors
│   ├── subscriptions/    # Payment/subscription logic
│   ├── triggers/         # Workflow triggers
│   └── workflows/        # Workflow CRUD
├── generated/
│   └── prisma/           # Generated Prisma client
├── hooks/                # Shared React hooks
├── inngest/              # Background job definitions
│   ├── client.ts         # Inngest client
│   ├── functions.ts      # Workflow execution function
│   ├── utils.ts          # Topological sort, etc.
│   └── channels/         # Realtime channel definitions
├── lib/                  # Utilities
│   ├── auth.ts           # Better Auth configuration
│   ├── db.ts             # Prisma client singleton
│   ├── encryption.ts     # Credential encryption
│   └── utils.ts          # General utilities
└── trpc/                 # tRPC setup
    ├── routers/          # API routers
    └── init.ts           # tRPC initialization
```

## Core Concepts

### 1. Workflows

A **Workflow** is a directed acyclic graph (DAG) of nodes connected by edges.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│  HTTP Node  │────▶│   AI Node   │
│   (Start)   │     │  (Fetch)    │     │  (Process)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Database Schema:**
- `Workflow` - Container for nodes and connections
- `Node` - Individual step (trigger, action, AI call)
- `Connection` - Edge between two nodes
- `Execution` - Record of a workflow run

### 2. Node Types

Nodes are categorized into:

#### Triggers (Start Nodes)
- `MANUAL_TRIGGER` - Click to execute
- `GOOGLE_FORM_TRIGGER` - Form submission webhook
- `STRIPE_TRIGGER` - Payment webhook

#### Actions (Execution Nodes)
- `HTTP_REQUEST` - Make API calls
- `OPENAI` - GPT models
- `ANTHROPIC` - Claude models
- `GEMINI` - Google AI models
- `DISCORD` - Send Discord messages
- `SLACK` - Send Slack messages

### 3. Node Component Registry

Each node type maps to a React component for the editor:

```typescript
// src/config/node-components.ts
export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.OPENAI]: OpenAiNode,
  // ...
};
```

## Workflow Execution Engine

The execution engine uses **Inngest** for durable, reliable background processing.

### Execution Flow

```
1. User clicks "Execute" in UI
        ↓
2. tRPC router sends Inngest event
   inngest.send({ name: "workflows/execute.workflow", data: { workflowId } })
        ↓
3. Inngest receives event, triggers executeWorkflow function
        ↓
4. Function creates Execution record in database
        ↓
5. Nodes sorted topologically (respecting dependencies)
        ↓
6. Each node executed sequentially:
   ┌──────────────────────────────────────────┐
   │  For each node:                          │
   │  1. Get executor from registry           │
   │  2. Execute with context from prev nodes │
   │  3. Publish realtime status update       │
   │  4. Return updated context               │
   └──────────────────────────────────────────┘
        ↓
7. Execution marked as SUCCESS/FAILED
```

### Node Executor Pattern

Each node type has an **executor** function:

```typescript
// src/features/executions/lib/executors/openai.ts
export const openAiExecutor = async ({
  data,        // Node configuration (prompt, model, etc.)
  nodeId,      // Unique node ID
  userId,      // Owner's ID (for credentials)
  context,     // Accumulated data from previous nodes
  step,        // Inngest step tools
  publish,     // Realtime update publisher
}) => {
  // 1. Publish "running" status
  await publish({ channel: OPENAI_CHANNEL_NAME, topic: "status", data: { nodeId, status: "running" }});
  
  // 2. Execute logic (call OpenAI API)
  const result = await step.run(`openai-${nodeId}`, async () => {
    // ... API call with template interpolation
  });
  
  // 3. Publish "completed" status
  await publish({ channel: OPENAI_CHANNEL_NAME, topic: "status", data: { nodeId, status: "completed" }});
  
  // 4. Return updated context
  return { ...context, [data.variableName]: result };
};
```

### Executor Registry

```typescript
// src/features/executions/lib/executor-registry.ts
const executors = {
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.OPENAI]: openAiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  // ...
};

export const getExecutor = (nodeType: NodeType) => executors[nodeType];
```

## Realtime Updates

The UI receives live execution status via **Inngest Realtime** (WebSocket).

### Architecture

```
┌─────────────────┐     WebSocket     ┌─────────────────┐
│   Browser UI    │◀──────────────────│   Inngest       │
│   (useChannel)  │                   │   (publish())   │
└─────────────────┘                   └─────────────────┘
```

### Channel Definition

```typescript
// src/inngest/channels/openai.ts
export const OPENAI_CHANNEL_NAME = "openai";

export const openAiChannel = () => channel(OPENAI_CHANNEL_NAME)
  .filter(({ event }) => event.name === "workflows/execute.workflow")
  .topic("status");
```

### Frontend Hook

```typescript
// Component
const nodeStatus = useNodeStatus({
  nodeId: props.id,
  channel: OPENAI_CHANNEL_NAME,
  topic: "status",
  refreshToken: fetchOpenAiRealtimeToken,
});
// Returns: "idle" | "running" | "completed" | "failed"
```

## Template Interpolation

Node data supports variable interpolation using `{{variableName}}` syntax:

```typescript
// User prompt: "Summarize: {{httpResponse.data}}"
const interpolated = interpolateTemplate(userPrompt, context);
// Result: "Summarize: { actual data from HTTP node }"
```

This allows nodes to reference output from previous nodes in the workflow.

## Authentication

Uses **Better Auth** with session-based authentication:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [polarPlugin()], // Subscription integration
  // ...
});
```

Protected routes check session via middleware or server components.

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│  React Flow Editor  │  tRPC Queries/Mutations  │  Realtime WS  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│  tRPC Routers  │  API Routes  │  Server Actions  │  Middleware  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌───────────────────────┐   ┌───────────────────────┐
│      POSTGRESQL       │   │       INNGEST         │
├───────────────────────┤   ├───────────────────────┤
│  Prisma ORM           │   │  Background Jobs      │
│  Users, Workflows,    │   │  Workflow Execution   │
│  Nodes, Executions    │   │  Realtime Updates     │
└───────────────────────┘   └───────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │    EXTERNAL APIS      │
                          ├───────────────────────┤
                          │  OpenAI, Anthropic,   │
                          │  Gemini, Discord,     │
                          │  Slack, HTTP APIs     │
                          └───────────────────────┘
```

## Key Files Reference

| Purpose | File |
|---------|------|
| Workflow execution | `src/inngest/functions.ts` |
| Node executor registry | `src/features/executions/lib/executor-registry.ts` |
| Node component registry | `src/config/node-components.ts` |
| Database schema | `prisma/schema.prisma` |
| tRPC routers | `src/trpc/routers/*.ts` |
| Auth configuration | `src/lib/auth.ts` |
| Credential encryption | `src/lib/encryption.ts` |
