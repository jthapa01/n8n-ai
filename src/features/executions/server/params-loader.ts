import { createLoader } from "nuqs/server";
import { executionsParams } from "../params";

// reads server-side URL query parameter parser
export const executionsParamsLoader = createLoader(executionsParams);
