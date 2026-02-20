import { Router, Request, Response } from "express";
import {
  getParametersByPath,
  getParameter,
  searchParameters,
  putParameter,
  deleteParameters,
  getParameterHistory,
  copyParameters,
} from "./ssm.js";

const router = Router();

/**
 * GET /api/parameters
 * Query params: path (required), recursive (default true), search (optional)
 */
router.get("/parameters", async (req: Request, res: Response) => {
  try {
    const { path, recursive, search } = req.query;

    if (search && typeof search === "string") {
      const results = await searchParameters(search);
      return res.json({ parameters: results });
    }

    if (!path || typeof path !== "string") {
      return res.status(400).json({ error: "path query parameter is required" });
    }

    const isRecursive = recursive !== "false";
    const parameters = await getParametersByPath(path, isRecursive);
    return res.json({ parameters });
  } catch (err: any) {
    console.error("Error fetching parameters:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch parameters" });
  }
});

/**
 * GET /api/parameters/detail
 * Query params: name (required)
 */
router.get("/parameters/detail", async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name query parameter is required" });
    }

    const parameter = await getParameter(name);
    return res.json({ parameter });
  } catch (err: any) {
    console.error("Error fetching parameter:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch parameter" });
  }
});

/**
 * GET /api/parameters/history
 * Query params: name (required)
 */
router.get("/parameters/history", async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name query parameter is required" });
    }

    const history = await getParameterHistory(name);
    return res.json({ history });
  } catch (err: any) {
    console.error("Error fetching parameter history:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch parameter history" });
  }
});

/**
 * POST /api/parameters
 * Body: { name, value, type, description }
 */
router.post("/parameters", async (req: Request, res: Response) => {
  try {
    const { name, value, type, description } = req.body;

    if (!name || !value) {
      return res.status(400).json({ error: "name and value are required" });
    }

    const version = await putParameter(
      name,
      value,
      type || "String",
      description,
      false // Don't overwrite on create
    );

    return res.json({ success: true, version });
  } catch (err: any) {
    console.error("Error creating parameter:", err);
    return res.status(500).json({ error: err.message || "Failed to create parameter" });
  }
});

/**
 * PUT /api/parameters
 * Body: { name, value, type, description }
 */
router.put("/parameters", async (req: Request, res: Response) => {
  try {
    const { name, value, type, description } = req.body;

    if (!name || value === undefined) {
      return res.status(400).json({ error: "name and value are required" });
    }

    const version = await putParameter(name, value, type || "String", description, true);
    return res.json({ success: true, version });
  } catch (err: any) {
    console.error("Error updating parameter:", err);
    return res.status(500).json({ error: err.message || "Failed to update parameter" });
  }
});

/**
 * PUT /api/parameters/bulk
 * Body: { parameters: [{ name, value, type?, description? }] }
 */
router.put("/parameters/bulk", async (req: Request, res: Response) => {
  try {
    const { parameters } = req.body;

    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({ error: "parameters array is required" });
    }

    const results: { name: string; success: boolean; version?: number; error?: string }[] = [];

    for (const param of parameters) {
      try {
        const version = await putParameter(
          param.name,
          param.value,
          param.type || "String",
          param.description,
          true
        );
        results.push({ name: param.name, success: true, version });
      } catch (err: any) {
        results.push({ name: param.name, success: false, error: err.message });
      }
    }

    return res.json({ results });
  } catch (err: any) {
    console.error("Error bulk updating parameters:", err);
    return res.status(500).json({ error: err.message || "Failed to bulk update parameters" });
  }
});

/**
 * POST /api/parameters/copy
 * Body: { sourcePaths: string[], sourcePrefix: string, targetPrefix: string }
 */
router.post("/parameters/copy", async (req: Request, res: Response) => {
  try {
    const { sourcePaths, sourcePrefix, targetPrefix } = req.body;

    if (!sourcePaths || !Array.isArray(sourcePaths) || !sourcePrefix || !targetPrefix) {
      return res
        .status(400)
        .json({ error: "sourcePaths, sourcePrefix, and targetPrefix are required" });
    }

    const result = await copyParameters(sourcePaths, sourcePrefix, targetPrefix);
    return res.json(result);
  } catch (err: any) {
    console.error("Error copying parameters:", err);
    return res.status(500).json({ error: err.message || "Failed to copy parameters" });
  }
});

/**
 * DELETE /api/parameters
 * Body: { names: string[] }
 */
router.delete("/parameters", async (req: Request, res: Response) => {
  try {
    const { names } = req.body;

    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: "names array is required" });
    }

    const result = await deleteParameters(names);
    return res.json(result);
  } catch (err: any) {
    console.error("Error deleting parameters:", err);
    return res.status(500).json({ error: err.message || "Failed to delete parameters" });
  }
});

export default router;
