import { Request } from 'express';

export interface RequestUser extends Request {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    //role: string
  };
}

export type User = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
  password: string;
};
