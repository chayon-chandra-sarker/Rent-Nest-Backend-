

export interface registerUserPayload {
    name: string;
    email:string;
    password:string;
};

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  image?: string;
  address?: string;
};

