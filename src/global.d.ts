declare module "node-qiwi-api";
declare namespace Express {
  export interface Request {
    user?: string;
  }
}
