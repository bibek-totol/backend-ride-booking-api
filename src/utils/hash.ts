import bcrypt from 'bcrypt';


const saltRounds = Number(process.env.SALT_ROUNDS || 14);


export const hashPassword = async (password: string) => {
return bcrypt.hash(password, saltRounds);
};


export const comparePassword = async (password: string, hash: string) => {
return bcrypt.compare(password, hash);
};