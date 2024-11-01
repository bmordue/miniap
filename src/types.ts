type Actor = {
  "@context": string[];
  type: string;
  id: string;
  inbox: string;
  outbox: string;
  following: string;
  followers: string;
  preferredUsername: string;
  name: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

type OrderedCollection = {
  "@context": string;
  type: string;
  totalItems: number;
  orderedItems: any[];
}

type Note = {
  "@context": string;
  type: string;
  id: string;
  attributedTo: string;
  content: string;
  published: string;
  to: string[];
}

type Create = {
  "@context": string;
  type: string;
  id: string;
  actor: string;
  published: string;
  object: Note;
  to: string[];
}
