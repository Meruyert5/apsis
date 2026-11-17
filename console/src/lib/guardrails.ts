export interface Guardrail {
  control: string;
  label: string;
  note: string;
}

const BY_ACTION: Record<string, Guardrail> = {
  "sts:AssumeRole": {
    control: "SCP + Access Analyzer",
    label: "restrict role assumption",
    note: "Deny the role target outside the platform boundary; alert on new external trust.",
  },
  "iam:PassRole": {
    control: "SCP + permissions boundary",
    label: "contain PassRole",
    note: "Deny PassRole to compute resources outside the platform role set.",
  },
  "iam:CreateAccessKey": {
    control: "Config + CloudTrail alarm",
    label: "alert on key creation",
    note: "Config rule on long-lived keys; page on CreateAccessKey outside the key service.",
  },
  "iam:CreatePolicyVersion": {
    control: "SCP + Config",
    label: "deny policy rewrites",
    note: "Deny CreatePolicyVersion except the policy platform role; drift alert.",
  },
  "iam:AttachUserPolicy": {
    control: "SCP + Access Analyzer",
    label: "deny user policy attach",
    note: "Deny AttachUserPolicy outside the identity platform role.",
  },
  "iam:AttachRolePolicy": {
    control: "SCP + Access Analyzer",
    label: "deny role policy attach",
    note: "Deny AttachRolePolicy outside the identity platform role.",
  },
  "iam:PutRolePolicy": {
    control: "SCP + Config",
    label: "deny inline role policy",
    note: "Deny PutRolePolicy outside the identity platform role.",
  },
  "iam:PutUserPolicy": {
    control: "SCP + Config",
    label: "deny inline user policy",
    note: "Deny PutUserPolicy outside the identity platform role.",
  },
  "iam:AddUserToGroup": {
    control: "SCP + group baseline",
    label: "lock group membership",
    note: "Deny AddUserToGroup except the directory service; review group baseline.",
  },
  "iam:UpdateAssumeRolePolicy": {
    control: "Access Analyzer + SCP",
    label: "pin trust policy",
    note: "Alert on trust changes; deny external principals by boundary.",
  },
  "iam:CreateLoginProfile": {
    control: "Config + CloudTrail alarm",
    label: "alert on console access",
    note: "Page on CreateLoginProfile outside the support tooling role.",
  },
};

export function guardrailForAction(action: string): Guardrail {
  return BY_ACTION[action] ?? {
    control: "IAM Access Analyzer",
    label: "review the grant",
    note: "No specific control mapping; review the action and scope before revoking.",
  };
}

export function uniqueGuardrails(actions: string[]): Guardrail[] {
  const seen = new Set<string>();
  const rows: Guardrail[] = [];
  for (const action of actions) {
    const guardrail = guardrailForAction(action);
    if (seen.has(guardrail.control)) continue;
    seen.add(guardrail.control);
    rows.push(guardrail);
  }
  return rows;
}
