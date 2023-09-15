export type JWTData = {
   username: string;
   email: string;
   isAdmin: boolean;
   isTeacher: boolean;
   iat: number;
   exp: number;
};

export interface UserConfirmationJWT {
   userId: number;
}