export function parse_mentions(content: string): string[] {
  const mention_pattern =
    /@([a-zA-Z0-9_]+(@[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])?)/g;
  const mentions = content.match(mention_pattern) || [];
  return mentions.map(normalize_mention);
}

export async function resolve_mentions(mentions: string[]): Promise<any[]> {
  const resolved = [];
  for (const mention of mentions) {
    let actor;
    if (isLocalUser(mention)) {
      actor = await getLocalActor(mention);
    } else {
      actor = await webfingerLookup(mention);
    }
    if (actor) {
      resolved.push(actor);
    }
  }
  return resolved;
}

function normalize_mention(mention: string): any {
  throw new Error("Function not implemented.");
}

function isLocalUser(mention: string): boolean {
  throw new Error("Function not implemented.");
}

function getLocalActor(mention: string): any {
  throw new Error("Function not implemented.");
}

function webfingerLookup(mention: string): any {
  throw new Error("Function not implemented.");
}
