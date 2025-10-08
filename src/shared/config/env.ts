import dotenv from 'dotenv';
dotenv.config();

interface Config {
  clerk: {
    issuer: string;
    jwksUri: string;
    webhookSigningSecret: string;
    apiKey: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}
export const config: Config = {
  clerk: {
    issuer: process.env.CLERK_ISSUER || '',
    jwksUri: process.env.CLERK_JWKS_URI || '',
    webhookSigningSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET || '',
    apiKey: process.env.CLERK_API_KEY || '',
  },
  aws: {
    region: process.env['AWS_REGION'] || 'us-east-2',
    accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
  },
};
