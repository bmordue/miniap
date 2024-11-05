import httpSignature from 'http-signature';

export function signActivity(activity: any, privateKey: string, keyId: string): any {
    const signedActivity = { ...activity };
    const options = {
      key: privateKey,
      keyId: keyId,
      headers: ['(request-target)', 'date', 'digest'],
    };
    httpSignature.sign(signedActivity, options);
    return signedActivity;
  };

export function build_thread_tree(posts: any[]): any {
  const posts_by_id: { [key: string]: any } = {};
  posts.forEach(post => {
    posts_by_id[post.id] = { ...post, replies: [] };
  });

  let root = null;
  posts.forEach(post => {
    if (post.in_reply_to_id) {
      const parent = posts_by_id[post.in_reply_to_id];
      parent.replies.push(posts_by_id[post.id]);
    } else {
      root = posts_by_id[post.id];
    }
  });

  return root;
}
