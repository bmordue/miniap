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

