import {
  SSMClient,
  GetParametersByPathCommand,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParametersCommand,
  GetParameterHistoryCommand,
  DescribeParametersCommand,
  type Parameter,
  type ParameterHistory,
  type ParameterMetadata,
} from "@aws-sdk/client-ssm";

const client = new SSMClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    ...(process.env.AWS_SESSION_TOKEN
      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
      : {}),
  },
});

export interface SSMParameter {
  Name: string;
  Value: string;
  Type: string;
  Version: number;
  LastModifiedDate: string;
  ARN?: string;
  Description?: string;
}

export interface SSMParameterHistory {
  Name: string;
  Value: string;
  Type: string;
  Version: number;
  LastModifiedDate: string;
  Description?: string;
}

/**
 * Get all parameters under a path prefix, recursively.
 * Handles pagination automatically.
 */
export async function getParametersByPath(
  path: string,
  recursive: boolean = true,
  withDecryption: boolean = true
): Promise<SSMParameter[]> {
  const parameters: SSMParameter[] = [];
  let nextToken: string | undefined;

  do {
    const command = new GetParametersByPathCommand({
      Path: path,
      Recursive: recursive,
      WithDecryption: withDecryption,
      MaxResults: 10,
      NextToken: nextToken,
    });

    const response = await client.send(command);

    if (response.Parameters) {
      for (const p of response.Parameters) {
        parameters.push({
          Name: p.Name || "",
          Value: p.Value || "",
          Type: p.Type || "String",
          Version: p.Version || 1,
          LastModifiedDate: p.LastModifiedDate?.toISOString() || "",
          ARN: p.ARN,
        });
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return parameters;
}

/**
 * Get a single parameter by name.
 */
export async function getParameter(
  name: string,
  withDecryption: boolean = true
): Promise<SSMParameter> {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption,
  });

  const response = await client.send(command);
  const p = response.Parameter!;

  return {
    Name: p.Name || "",
    Value: p.Value || "",
    Type: p.Type || "String",
    Version: p.Version || 1,
    LastModifiedDate: p.LastModifiedDate?.toISOString() || "",
    ARN: p.ARN,
  };
}

/**
 * Search parameters by name pattern. Uses DescribeParameters with filters.
 */
export async function searchParameters(
  search: string
): Promise<SSMParameter[]> {
  const parameters: SSMParameter[] = [];
  let nextToken: string | undefined;

  // First get metadata via DescribeParameters
  const metadataList: ParameterMetadata[] = [];

  do {
    const command = new DescribeParametersCommand({
      ParameterFilters: [
        {
          Key: "Name",
          Option: "Contains",
          Values: [search],
        },
      ],
      MaxResults: 50,
      NextToken: nextToken,
    });

    const response = await client.send(command);
    if (response.Parameters) {
      metadataList.push(...response.Parameters);
    }
    nextToken = response.NextToken;
  } while (nextToken);

  // Then get actual values for each (in batches)
  for (const meta of metadataList) {
    try {
      const param = await getParameter(meta.Name || "");
      param.Description = meta.Description;
      parameters.push(param);
    } catch {
      // Skip parameters we can't read
    }
  }

  return parameters;
}

/**
 * Create or update a parameter.
 */
export async function putParameter(
  name: string,
  value: string,
  type: string = "String",
  description?: string,
  overwrite: boolean = true
): Promise<number> {
  const command = new PutParameterCommand({
    Name: name,
    Value: value,
    Type: type as any,
    Description: description,
    Overwrite: overwrite,
  });

  const response = await client.send(command);
  return response.Version || 1;
}

/**
 * Delete one or more parameters (max 10 at a time per API limit).
 */
export async function deleteParameters(names: string[]): Promise<{
  deleted: string[];
  failed: string[];
}> {
  const deleted: string[] = [];
  const failed: string[] = [];

  // API allows max 10 at a time
  for (let i = 0; i < names.length; i += 10) {
    const batch = names.slice(i, i + 10);
    const command = new DeleteParametersCommand({
      Names: batch,
    });

    const response = await client.send(command);
    if (response.DeletedParameters) {
      deleted.push(...response.DeletedParameters);
    }
    if (response.InvalidParameters) {
      failed.push(...response.InvalidParameters);
    }
  }

  return { deleted, failed };
}

/**
 * Get parameter version history.
 */
export async function getParameterHistory(
  name: string,
  withDecryption: boolean = true
): Promise<SSMParameterHistory[]> {
  const history: SSMParameterHistory[] = [];
  let nextToken: string | undefined;

  do {
    const command = new GetParameterHistoryCommand({
      Name: name,
      WithDecryption: withDecryption,
      MaxResults: 50,
      NextToken: nextToken,
    });

    const response = await client.send(command);

    if (response.Parameters) {
      for (const p of response.Parameters) {
        history.push({
          Name: p.Name || "",
          Value: p.Value || "",
          Type: p.Type || "String",
          Version: p.Version || 1,
          LastModifiedDate: p.LastModifiedDate?.toISOString() || "",
          Description: p.Description,
        });
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return history;
}

/**
 * Copy parameters from one path prefix to another.
 * E.g., copy /dev/app/ -> /staging/app/
 */
export async function copyParameters(
  sourcePaths: string[],
  sourcePrefix: string,
  targetPrefix: string
): Promise<{ copied: string[]; failed: { name: string; error: string }[] }> {
  const copied: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const sourcePath of sourcePaths) {
    try {
      const param = await getParameter(sourcePath);
      const newName = sourcePath.replace(sourcePrefix, targetPrefix);

      await putParameter(newName, param.Value, param.Type, undefined, true);
      copied.push(newName);
    } catch (err: any) {
      failed.push({ name: sourcePath, error: err.message || "Unknown error" });
    }
  }

  return { copied, failed };
}
